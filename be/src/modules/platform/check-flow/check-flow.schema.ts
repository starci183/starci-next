import { isRecord } from "@modules/platform/primitives"
import {
    ASSERT_OPS,
    FLOW_CAPS,
    FLOW_METHODS,
    READ_METHODS,
    type AssertOp,
    type CheckFlow,
    type FlowAction,
    type FlowAssertion,
    type FlowCaps,
    type FlowIssue,
    type FlowParse,
    type FlowPlugin,
    type FlowRequestSpec,
    type FlowStep,
} from "./check-flow.contracts"
import {
    isStatusPattern,
    pathSegmentsOf,
    SELECTOR_HEADS,
    splitSelector,
    templateNamesOf,
} from "./check-flow-value.policy"

/** The inputs a flow may read, and the `needs` entry each one requires. */
export const FLOW_INPUTS: Readonly<Record<string, string | null>> = {
    "run.id": null,
    "sink.url": null,
    "endpoint.method": "endpoint",
    "endpoint.path": "endpoint",
    "sample.body": "sample",
}

/** The `needs` entries a flow may declare. */
export const FLOW_NEEDS: ReadonlyArray<string> = ["endpoint", "sample"]

/** Whether a need is `sample.<var>` for one of the flow's vars: the declared sample body must hold `{{<var>}}`. */
const sampleVarOf = (need: string, vars: Readonly<Record<string, string>>): boolean =>
    need.startsWith("sample.") && need.slice("sample.".length) in vars

const ID = /^[a-z][a-z0-9-]{0,63}$/u
const NAME = /^[A-Za-z][\w-]{0,63}$/u
const HEADER = /^[a-z0-9-]{1,64}$/u

/** Collects the issues of one document as it is read. */
class Reader {
    readonly issues: Array<FlowIssue> = []

    issue(at: string, message: string): void {
        this.issues.push({ at, message })
    }

    text(value: unknown, at: string): string {
        if (typeof value === "string" && value !== "") return value
        this.issue(at, "must be a non-empty string")
        return ""
    }

    count(value: unknown, at: string, max: number, fallback: number): number {
        if (value === undefined) return fallback
        if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= max) return value
        this.issue(at, `must be a whole number from 1 to ${max}`)
        return fallback
    }
}

/** What the steps before the one being read declared. */
interface Known {
    readonly steps: Set<string>
    readonly captures: Set<string>
    readonly needs: ReadonlySet<string>
    readonly hasSink: boolean
    readonly plugins: ReadonlyMap<string, FlowPlugin>
}

const checkTemplate = (reader: Reader, template: string, at: string, known: Known): void => {
    templateNamesOf(template).forEach((name) => {
        if (known.captures.has(name)) return
        if (!(name in FLOW_INPUTS)) {
            reader.issue(at, `reads {{${name}}}, which is neither an input nor captured by an earlier step`)
            return
        }
        const need = FLOW_INPUTS[name] ?? null
        if (need !== null && !known.needs.has(need))
            reader.issue(at, `reads {{${name}}} but needs does not list ${need}`)
        if (name === "sink.url" && !known.hasSink) reader.issue(at, "reads {{sink.url}} but the flow has no sink step")
    })
}

const checkSelector = (reader: Reader, selector: string, at: string, known: Known): void => {
    const { expression } = splitSelector(selector, known.steps)
    const words = expression.trim().split(/\s+/u)
    const [head = "", second, third] = words
    if (!SELECTOR_HEADS.includes(head)) {
        reader.issue(at, `selector ${selector} must start with one of ${SELECTOR_HEADS.join(", ")}`)
        return
    }
    if (head === "var" && (second === undefined || !(known.captures.has(second) || second in FLOW_INPUTS))) {
        reader.issue(at, `selector ${selector} reads a value no earlier step captured`)
    }
    if ((head === "count" || head === "first") && second !== undefined && !isStatusPattern(second)) {
        reader.issue(at, `selector ${selector}: ${second} is not a status pattern (429, 2xx, any)`)
    }
    const jsonAt = words.indexOf("json")
    if (jsonAt >= 0 && pathSegmentsOf(words[jsonAt + 1] ?? "") === null) {
        reader.issue(at, `selector ${selector}: the JSON path must start with $`)
    }
    if (head === "header" && (second === undefined || !HEADER.test(second.toLowerCase()))) {
        reader.issue(at, `selector ${selector} must name a header`)
    }
    if (third === "header" && words[3] === undefined) reader.issue(at, `selector ${selector} must name a header`)
}

const assertionOf = (reader: Reader, raw: unknown, at: string, known: Known): FlowAssertion | null => {
    if (!isRecord(raw)) {
        reader.issue(at, "must be a map with that, one operator and fail")
        return null
    }
    const that = reader.text(raw["that"], `${at}.that`)
    const fail = reader.text(raw["fail"], `${at}.fail`)
    if (fail !== "" && !ID.test(fail)) reader.issue(`${at}.fail`, "must be a kebab-case reason code")
    const ops = ASSERT_OPS.filter((op) => op in raw)
    const extra = Object.keys(raw).filter((key) => !["that", "fail", ...ASSERT_OPS].includes(key))
    if (ops.length !== 1) reader.issue(at, `must carry exactly one operator of ${ASSERT_OPS.join(", ")}`)
    if (extra.length > 0) reader.issue(at, `unknown keys ${extra.join(", ")}`)
    const op: AssertOp = ops[0] ?? "eq"
    const value: unknown = raw[op]
    if (that !== "") checkSelector(reader, that, `${at}.that`, known)
    if (typeof value === "string") checkTemplate(reader, value, `${at}.${op}`, known)
    return { that, op, value, fail }
}

const headersOf = (reader: Reader, raw: unknown, at: string, known: Known): Record<string, string> => {
    if (raw === undefined) return {}
    if (!isRecord(raw)) {
        reader.issue(at, "must be a map of header names to texts")
        return {}
    }
    return Object.fromEntries(
        Object.entries(raw).map(([name, value]) => {
            const lower = name.toLowerCase()
            if (!HEADER.test(lower)) reader.issue(`${at}.${name}`, "is not a header name")
            const text = typeof value === "string" ? value : String(value)
            checkTemplate(reader, text, `${at}.${name}`, known)
            return [lower, text]
        }),
    )
}

const isWriteTemplate = (method: string): boolean =>
    method.includes("{{") || !READ_METHODS.includes(method.toUpperCase())

const requestOf = (reader: Reader, raw: unknown, at: string, known: Known): FlowRequestSpec => {
    if (!isRecord(raw)) {
        reader.issue(at, "must be a map with method and path")
        return { method: "GET", path: "/", headers: {}, body: null }
    }
    const method = reader.text(raw["method"], `${at}.method`)
    const path = reader.text(raw["path"], `${at}.path`)
    if (method !== "" && !method.includes("{{") && !(FLOW_METHODS as ReadonlyArray<string>).includes(method)) {
        reader.issue(`${at}.method`, `must be one of ${FLOW_METHODS.join(", ")} or a template`)
    }
    if (path !== "" && !path.startsWith("/") && !path.startsWith("{{")) reader.issue(`${at}.path`, "must start with /")
    if (method !== "" && isWriteTemplate(method) && !path.startsWith("{{endpoint.path")) {
        reader.issue(
            `${at}.path`,
            "a write may only go to the declared endpoint: start the path with {{endpoint.path}}",
        )
    }
    const body = raw["body"] === undefined || raw["body"] === null ? null : String(raw["body"])
    ;[method, path, body ?? ""].forEach((text) => checkTemplate(reader, text, at, known))
    return { method, path, headers: headersOf(reader, raw["headers"], `${at}.headers`, known), body }
}

const STEP_KEYS: ReadonlyArray<string> = ["id", "request", "fanOut", "wait", "sink", "capture", "expect"]

const actionOf = (reader: Reader, raw: Record<string, unknown>, at: string, known: Known): FlowAction => {
    const pluginKeys = Object.keys(raw).filter((key) => known.plugins.has(key))
    const kinds = [...["request", "wait", "sink"].filter((key) => key in raw), ...pluginKeys]
    Object.keys(raw)
        .filter((key) => !STEP_KEYS.includes(key) && !known.plugins.has(key))
        .forEach((key) =>
            reader.issue(`${at}.${key}`, "is not a step key here (no primitive of that name is registered)"),
        )
    if (kinds.length !== 1)
        reader.issue(at, "must carry exactly one action: request, wait, sink or a registered primitive")
    const pluginKey = pluginKeys[0]
    const plugin = pluginKey === undefined ? undefined : known.plugins.get(pluginKey)
    if (pluginKey !== undefined && plugin !== undefined) {
        const params = plugin.parse(raw[pluginKey], `${at}.${pluginKey}`, (where, message) =>
            reader.issue(where, message),
        )
        return { kind: "plugin", key: pluginKey, params }
    }
    if ("wait" in raw) return { kind: "wait", ms: reader.count(raw["wait"], `${at}.wait`, FLOW_CAPS.waitMs, 1) }
    if ("sink" in raw) {
        const sink = raw["sink"]
        const within = isRecord(sink) ? sink["within"] : undefined
        return { kind: "sink", withinMs: reader.count(within, `${at}.sink.within`, FLOW_CAPS.waitMs, 1) }
    }
    return {
        kind: "request",
        request: requestOf(reader, raw["request"], `${at}.request`, known),
        fanOut: reader.count(raw["fanOut"], `${at}.fanOut`, FLOW_CAPS.fanOut, 1),
    }
}

const captureOf = (reader: Reader, raw: unknown, at: string, known: Known): Record<string, string> => {
    if (raw === undefined) return {}
    if (!isRecord(raw)) {
        reader.issue(at, "must be a map of names to selectors")
        return {}
    }
    return Object.fromEntries(
        Object.entries(raw).map(([name, selector]) => {
            if (!NAME.test(name) || name in FLOW_INPUTS) reader.issue(`${at}.${name}`, "is not a free capture name")
            const text = reader.text(selector, `${at}.${name}`)
            if (text !== "") checkSelector(reader, text, `${at}.${name}`, known)
            return [name, text]
        }),
    )
}

const stepOf = (reader: Reader, raw: unknown, at: string, known: Known): FlowStep | null => {
    if (!isRecord(raw)) {
        reader.issue(at, "must be a map")
        return null
    }
    const id = reader.text(raw["id"], `${at}.id`)
    if (id !== "" && !ID.test(id)) reader.issue(`${at}.id`, "must be kebab-case")
    if (known.steps.has(id)) reader.issue(`${at}.id`, `${id} is used twice`)
    const action = actionOf(reader, raw, at, known)
    const capture = captureOf(reader, raw["capture"], `${at}.capture`, {
        ...known,
        steps: new Set([...known.steps, id]),
    })
    const ownKnown: Known = {
        ...known,
        steps: new Set([...known.steps, id]),
        captures: new Set([...known.captures, ...Object.keys(capture)]),
    }
    const expectRaw = raw["expect"] ?? []
    const expect = Array.isArray(expectRaw)
        ? expectRaw.flatMap((entry, index) => assertionOf(reader, entry, `${at}.expect.${index}`, ownKnown) ?? [])
        : []
    if (!Array.isArray(expectRaw)) reader.issue(`${at}.expect`, "must be a list")
    known.steps.add(id)
    Object.keys(capture).forEach((name) => known.captures.add(name))
    return { id, action, capture, expect }
}

/** The totals of a flow the caps hold. */
const totalsOf = (steps: ReadonlyArray<FlowStep>) => {
    const requests = steps.flatMap((step) => (step.action.kind === "request" ? [step.action] : []))
    return {
        requests: requests.reduce((sum, action) => sum + action.fanOut, 0),
        writes: requests
            .filter((action) => isWriteTemplate(action.request.method))
            .reduce((sum, action) => sum + action.fanOut, 0),
        waitMs: steps.reduce((sum, step) => {
            if (step.action.kind === "wait") return sum + step.action.ms
            return step.action.kind === "sink" ? sum + step.action.withinMs : sum
        }, 0),
    }
}

const checkCaps = (reader: Reader, steps: ReadonlyArray<FlowStep>, caps: FlowCaps): void => {
    const totals = totalsOf(steps)
    if (steps.length > caps.steps) reader.issue("steps", `has ${steps.length} steps, more than ${caps.steps}`)
    if (totals.requests > caps.requests)
        reader.issue("steps", `sends ${totals.requests} requests, more than ${caps.requests}`)
    if (totals.writes > caps.writes) reader.issue("steps", `sends ${totals.writes} writes, more than ${caps.writes}`)
    if (totals.waitMs > caps.waitMs) reader.issue("steps", `waits ${totals.waitMs} ms, more than ${caps.waitMs}`)
}

/**
 * Reads a flow document (a probe or an e2e flow, already parsed from YAML) and checks it whole: ids, inputs, templates, selectors,
 * operators, the write rule (a write goes only to `{{endpoint.path}}`) and the caps. A document with any issue is refused, so the
 * runner only ever sees a flow it can run.
 */
export const parseCheckFlow = (
    raw: unknown,
    caps: FlowCaps = FLOW_CAPS,
    plugins: ReadonlyArray<FlowPlugin> = [],
): FlowParse => {
    const reader = new Reader()
    if (!isRecord(raw)) return { ok: false, issues: [{ at: "", message: "must be a map" }] }
    const id = reader.text(raw["id"], "id")
    if (id !== "" && !ID.test(id)) reader.issue("id", "must be kebab-case")
    const needsRaw = raw["needs"] ?? []
    const needs = Array.isArray(needsRaw) ? needsRaw.map(String) : []
    if (!Array.isArray(needsRaw)) reader.issue("needs", "must be a list")
    const varsRaw = raw["vars"] ?? {}
    const vars: Record<string, string> = {}
    if (isRecord(varsRaw)) {
        Object.entries(varsRaw).forEach(([name, value]) => {
            if (!NAME.test(name) || name in FLOW_INPUTS) reader.issue(`vars.${name}`, "is not a free name")
            vars[name] = typeof value === "string" ? value : String(value)
        })
    } else reader.issue("vars", "must be a map of names to texts")
    needs
        .filter(
            (need) =>
                !FLOW_NEEDS.includes(need) &&
                !sampleVarOf(need, vars) &&
                !plugins.some((plugin) => plugin.needs?.includes(need) === true),
        )
        .forEach((need) => reader.issue("needs", `unknown need ${need}`))
    if (needs.some((need) => need.startsWith("sample.")) && !needs.includes("sample")) {
        reader.issue("needs", "a sample.<var> need also needs sample")
    }
    const stepsRaw = raw["steps"]
    if (!Array.isArray(stepsRaw) || stepsRaw.length === 0) reader.issue("steps", "must be a non-empty list")
    const list: ReadonlyArray<unknown> = Array.isArray(stepsRaw) ? stepsRaw : []
    const known: Known = {
        steps: new Set(),
        captures: new Set(Object.keys(vars)),
        needs: new Set(needs),
        hasSink: list.some((step) => isRecord(step) && "sink" in step),
        plugins: new Map(plugins.map((plugin) => [plugin.key, plugin])),
    }
    const steps = list.flatMap((step, index) => stepOf(reader, step, `steps.${index}`, known) ?? [])
    if (!steps.some((step) => step.expect.length > 0)) reader.issue("steps", "no step asserts anything")
    checkCaps(reader, steps, caps)
    const pass = reader.text(raw["pass"], "pass")
    if (reader.issues.length > 0) return { ok: false, issues: reader.issues }
    return { ok: true, flow: { id, needs, vars, steps, pass } }
}

/** The totals a flow sends and waits, for a catalog check or a report. */
export const flowTotalsOf = (flow: CheckFlow): { requests: number; writes: number; waitMs: number } =>
    totalsOf(flow.steps)
