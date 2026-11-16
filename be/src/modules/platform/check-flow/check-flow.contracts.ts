/** The schema a probe or e2e flow document names. */
export const CHECK_FLOW_SCHEMA = "starci-next-data/check-flow@1"

/** The methods a flow may send; every other one is refused by the schema. */
export const FLOW_METHODS = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"] as const

/** The methods that only read: a request with any other method is a write. */
export const READ_METHODS: ReadonlyArray<string> = ["GET", "HEAD", "OPTIONS"]

/** The header every request of a flow carries, with the run id: the learner's app tells StarCi traffic apart by it. */
export const PROBE_HEADER = "x-starci-probe"

/** The comparison operators an assertion may use. */
export const ASSERT_OPS = [
    "eq",
    "ne",
    "in",
    "notIn",
    "is",
    "gt",
    "gte",
    "lt",
    "lte",
    "exists",
    "contains",
    "notContains",
    "matches",
    "notMatches",
    "disjoint",
] as const

/** One comparison operator. */
export type AssertOp = (typeof ASSERT_OPS)[number]

/** The caps every flow is held to, so a probe stays safe, read-mostly and rate-limited. */
export interface FlowCaps {
    /** The most requests a flow sends in total, fan-out included. */
    readonly requests: number
    /** The most write requests (any method but GET, HEAD, OPTIONS). */
    readonly writes: number
    /** The widest fan-out of one step. */
    readonly fanOut: number
    /** The most milliseconds of waiting and sink collection in total. */
    readonly waitMs: number
    /** The most steps. */
    readonly steps: number
}

/** The caps the server probe runner and the CLI apply to every flow. */
export const FLOW_CAPS: FlowCaps = { requests: 40, writes: 12, fanOut: 20, waitMs: 15_000, steps: 16 }

/** The request a step sends, every text a template. */
export interface FlowRequestSpec {
    /** The method, a template that must resolve to one of FLOW_METHODS. */
    readonly method: string
    /** The path, a template that must resolve to a path starting with `/`. */
    readonly path: string
    /** The headers, names lower-cased. */
    readonly headers: Readonly<Record<string, string>>
    /** The body template, or null for none. */
    readonly body: string | null
}

/** One assertion: a selector, an operator and the expected value; a failing assertion fails the flow with its reason. */
export interface FlowAssertion {
    /** The selector, for example `status`, `header x-request-id`, `json $.items[*].id`, `count 429`, `replay.body`. */
    readonly that: string
    /** The operator. */
    readonly op: AssertOp
    /** The expected value; a string is a template. */
    readonly value: unknown
    /** The stable reason code the flow fails with when this assertion does not hold. */
    readonly fail: string
}

/** What a step does. */
export type FlowAction =
    | { readonly kind: "request"; readonly request: FlowRequestSpec; readonly fanOut: number }
    | { readonly kind: "wait"; readonly ms: number }
    | { readonly kind: "sink"; readonly withinMs: number }
    | { readonly kind: "plugin"; readonly key: string; readonly params: unknown }

/** One step of a flow. */
export interface FlowStep {
    /** The step id, unique in the flow; later steps read its responses as `<id>.<selector>`. */
    readonly id: string
    /** What it does. */
    readonly action: FlowAction
    /** The values it keeps, name to selector; later templates read them as `{{name}}`. */
    readonly capture: Readonly<Record<string, string>>
    /** The assertions on its responses. */
    readonly expect: ReadonlyArray<FlowAssertion>
}

/** A flow: a probe or an e2e flow, written in the same language. */
export interface CheckFlow {
    /** The flow id (a probe id or a concept id). */
    readonly id: string
    /**
     * The inputs the flow needs, else it is skipped with `needs-<input>`: `endpoint`, `sample`, or `sample.<var>` (the declared sample
     * body must hold `{{<var>}}`, so the flow's own text reaches the learner's app).
     */
    readonly needs: ReadonlyArray<string>
    /** The flow's own constants, read as `{{<name>}}` by its templates and by the learner's sample body. */
    readonly vars: Readonly<Record<string, string>>
    /** The steps in order. */
    readonly steps: ReadonlyArray<FlowStep>
    /** The reason a passing flow reports. */
    readonly pass: string
}

/** A problem the schema found, with where. */
export interface FlowIssue {
    /** Where in the document, as a dotted path. */
    readonly at: string
    /** What is wrong. */
    readonly message: string
}

/** A parsed flow, or the problems that refused it. */
export type FlowParse =
    { readonly ok: true; readonly flow: CheckFlow } | { readonly ok: false; readonly issues: ReadonlyArray<FlowIssue> }

/** One response a step got, or one event a sink received. */
export interface FlowResponse {
    /** The status code (200 for a sink event). */
    readonly status: number
    /** The headers, names lower-cased. */
    readonly headers: Readonly<Record<string, string>>
    /** The body as text. */
    readonly body: string
    /** How long the request took, in milliseconds (0 for a sink event). */
    readonly ms: number
}

/** The inputs a run is given: the base address and what the learner declared. */
export interface FlowInputs {
    /** The base address, `http(s)://host[:port]` with no trailing slash. */
    readonly base: string
    /** The declared endpoint `METHOD /path`, or null. */
    readonly endpoint: string | null
    /** The declared sample body, or null. */
    readonly sample: string | null
    /** The id of this run, sent in the probe header and usable as `{{run.id}}`. */
    readonly runId: string
}

/** How a flow run ended. */
export type FlowStatus = "passed" | "failed" | "skipped" | "unanswered"

/** What a flow run concluded. */
export interface FlowVerdict {
    /** Passed or failed (it ran and judged), skipped (an input is missing) or unanswered (a request got no response). */
    readonly status: FlowStatus
    /** The stable reason code. */
    readonly reason: string
    /** The facts for the text: the step and selector of a failure, its actual value, the requests sent. */
    readonly facts: Readonly<Record<string, string | number>>
}

/** What a plugin step is given when it runs: the run's scope and a resolver for its own templates. */
export interface FlowPluginContext {
    /** The scope: inputs, vars and captures so far. */
    readonly scope: Readonly<Record<string, unknown>>
    /** Resolves a template against the scope; a missing name ends the run as skipped with `needs-<name>`. */
    resolve(template: string): string
}

/**
 * A step primitive a host adds to the language (the CLI's local checks: `file.exists`, `shell`, `hook.simulate`). A step whose one
 * action key is a plugin key runs through `perform`, and its response feeds the same selectors and assertions as a request. Plugin
 * steps are outside the base-address and write rules, so only a host that runs on the learner's own machine registers any; the
 * server registers none, and a flow that uses one is refused there by the schema.
 */
export interface FlowPlugin {
    /** The step's action key, for example `file.exists`. */
    readonly key: string
    /** The `needs` entries this primitive answers (for example `git`); a flow may list them. */
    readonly needs?: ReadonlyArray<string>
    /** Whether a need of `needs` is met on this host; an unmet one skips the run with `needs-<need>`. */
    meets?(need: string): boolean
    /** Reads the step's parameters, reporting every problem through `issue`; the result is handed back to `perform`. */
    parse(raw: unknown, at: string, issue: (at: string, message: string) => void): unknown
    /** Runs the step and answers one response. */
    perform(params: unknown, context: FlowPluginContext): Promise<FlowResponse>
}
