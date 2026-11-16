import {
    FLOW_METHODS,
    PROBE_HEADER,
    READ_METHODS,
    type CheckFlow,
    type FlowInputs,
    type FlowPlugin,
    type FlowRequestSpec,
    type FlowResponse,
    type FlowStep,
    type FlowVerdict,
} from "./check-flow.contracts"
import type { FlowPorts, FlowWireRequest } from "./check-flow.port"
import { eachInOrder } from "@modules/platform/primitives"
import { holds, resolveTemplate, select, templateNamesOf, textOf, type FlowScope } from "./check-flow-value.policy"

/** The longest actual value a verdict quotes. */
const FACT_MAX = 160

/** A step that ended the run early, with its verdict. */
class Stop {
    constructor(readonly verdict: FlowVerdict) {}
}

const stop = (status: FlowVerdict["status"], reason: string, facts: FlowVerdict["facts"] = {}): Stop =>
    new Stop({ status, reason, facts })

/** The method and path of a declared endpoint `METHOD /path`, or null when it is not one. */
export const endpointOf = (endpoint: string | null): { method: string; path: string } | null => {
    const match = endpoint === null ? null : /^([A-Z]+)\s+(\/\S*)$/u.exec(endpoint.trim())
    return match === null ? null : { method: String(match[1]), path: String(match[2]) }
}

/**
 * The scope a run starts with: its id, the flow's vars, and what the learner declared. The declared sample body is itself a
 * template over the run id and the vars, so a probe's own text (`{{message}}`) and a fresh value (`{{run.id}}`) reach the app.
 */
const scopeOf = (flow: CheckFlow, inputs: FlowInputs): Record<string, unknown> => {
    const endpoint = endpointOf(inputs.endpoint)
    const scope: Record<string, unknown> = { "run.id": inputs.runId }
    Object.entries(flow.vars).forEach(([name, value]) => {
        scope[name] = resolveText(value, scope)
    })
    if (endpoint !== null) {
        scope["endpoint.method"] = endpoint.method
        scope["endpoint.path"] = endpoint.path
    }
    if (inputs.sample !== null) scope["sample.body"] = resolveText(inputs.sample, scope)
    return scope
}

/** The first need the inputs do not meet, or undefined. */
const unmetNeedOf = (
    flow: CheckFlow,
    inputs: FlowInputs,
    plugins: ReadonlyMap<string, FlowPlugin>,
): string | undefined =>
    flow.needs.find((need) => {
        if (need === "endpoint") return endpointOf(inputs.endpoint) === null
        if (need === "sample") return inputs.sample === null
        const owner = [...plugins.values()].find((plugin) => plugin.needs?.includes(need) === true)
        if (owner !== undefined) return owner.meets?.(need) === false
        const name = need.slice("sample.".length)
        return inputs.sample === null || !templateNamesOf(inputs.sample).includes(name)
    })

/** Whether a path stays under the declared path: the same path, or below it, or with a query. */
const isUnder = (path: string, declared: string): boolean =>
    path === declared || path.startsWith(`${declared.replace(/\/$/u, "")}/`) || path.startsWith(`${declared}?`)

const resolveText = (template: string, scope: FlowScope): string => {
    const resolved = resolveTemplate(template, scope)
    if (!resolved.ok) throw stop("skipped", `needs-${resolved.missing}`)
    return textOf(resolved.value)
}

/**
 * Runs a flow (a server probe or an e2e flow; the same language and the same interpreter on the server and in the CLI). Every
 * request carries the probe header with the run id, stays on the base address, and a write goes only to the declared endpoint's
 * path; a request with no response ends the run as unanswered, which proves nothing either way. The first assertion that does not
 * hold fails the run with its reason.
 */
export class CheckFlowRunner {
    private readonly plugins: ReadonlyMap<string, FlowPlugin>

    constructor(
        private readonly ports: FlowPorts,
        plugins: ReadonlyArray<FlowPlugin> = [],
    ) {
        this.plugins = new Map(plugins.map((plugin) => [plugin.key, plugin]))
    }

    /** Runs the flow with the inputs and answers its verdict; it never throws for anything the target does. */
    async run(flow: CheckFlow, inputs: FlowInputs): Promise<FlowVerdict> {
        const missing = unmetNeedOf(flow, inputs, this.plugins)
        if (missing !== undefined) return { status: "skipped", reason: `needs-${missing.replace(".", "-")}`, facts: {} }
        let scope: Record<string, unknown>
        try {
            scope = scopeOf(flow, inputs)
        } catch (caught) {
            if (caught instanceof Stop) return caught.verdict
            throw caught
        }
        const sink = flow.steps.some((step) => step.action.kind === "sink") ? this.ports.sink : undefined
        if (sink === null) return { status: "skipped", reason: "needs-sink", facts: {} }
        const opened = sink === undefined ? null : await sink.open()
        if (opened !== null) scope["sink.url"] = opened.url
        const steps = new Map<string, ReadonlyArray<FlowResponse>>()
        let requests = 0
        try {
            await eachInOrder(flow.steps, async (step) => {
                const responses = await this.perform(step, inputs, scope, opened?.id ?? null)
                requests += step.action.kind === "request" ? responses.length : 0
                this.judge(step, responses, steps, scope)
                steps.set(step.id, responses)
            })
            return { status: "passed", reason: flow.pass, facts: { requests } }
        } catch (caught) {
            if (caught instanceof Stop) return { ...caught.verdict, facts: { ...caught.verdict.facts, requests } }
            throw caught
        } finally {
            if (opened !== null && sink !== undefined) await sink.close(opened.id)
        }
    }

    private async perform(
        step: FlowStep,
        inputs: FlowInputs,
        scope: FlowScope,
        sinkId: string | null,
    ): Promise<ReadonlyArray<FlowResponse>> {
        const { action } = step
        if (action.kind === "wait") {
            await this.ports.clock.sleep(action.ms)
            return []
        }
        if (action.kind === "sink") {
            await this.ports.clock.sleep(action.withinMs)
            const events = sinkId === null || this.ports.sink === null ? [] : await this.ports.sink.received(sinkId)
            return events.map((event) => ({ status: 200, headers: event.headers, body: event.body, ms: 0 }))
        }
        if (action.kind === "plugin") {
            const plugin = this.plugins.get(action.key)
            if (plugin === undefined) throw stop("skipped", "needs-primitive", { primitive: action.key })
            const response = await plugin.perform(action.params, {
                scope,
                resolve: (template) => resolveText(template, scope),
            })
            return [response]
        }
        const request = this.wireOf(action.request, inputs, scope)
        return Promise.all(Array.from({ length: action.fanOut }, () => this.send(request)))
    }

    private wireOf(spec: FlowRequestSpec, inputs: FlowInputs, scope: FlowScope): FlowWireRequest {
        const method = resolveText(spec.method, scope).toUpperCase()
        const path = resolveText(spec.path, scope)
        if (!(FLOW_METHODS as ReadonlyArray<string>).includes(method)) throw stop("skipped", "bad-method", { method })
        if (!path.startsWith("/") || path.startsWith("//")) throw stop("skipped", "bad-path")
        const declared = scope["endpoint.path"]
        if (!READ_METHODS.includes(method) && (typeof declared !== "string" || !isUnder(path, declared))) {
            throw stop("skipped", "write-outside-declared-path", { method })
        }
        const url = new URL(`${inputs.base}${path}`)
        if (url.origin !== new URL(inputs.base).origin) throw stop("unanswered", "target-refused")
        const body = spec.body === null ? null : resolveText(spec.body, scope)
        if (body !== null && (method === "GET" || method === "HEAD"))
            throw stop("skipped", "needs-write-endpoint", { method })
        const headers = Object.fromEntries(
            Object.entries(spec.headers).map(([name, value]) => [name, resolveText(value, scope)]),
        )
        return {
            method,
            url: url.toString(),
            headers: {
                accept: "application/json",
                ...(body === null ? {} : { "content-type": "application/json" }),
                ...headers,
                [PROBE_HEADER]: inputs.runId,
            },
            body,
        }
    }

    private async send(request: FlowWireRequest): Promise<FlowResponse> {
        const started = this.ports.clock.now()
        const reply = await this.ports.transport.send(request)
        if (!reply.ok) throw stop("unanswered", reply.error)
        return { status: reply.status, headers: reply.headers, body: reply.body, ms: this.ports.clock.now() - started }
    }

    /** Captures the step's values, then checks its assertions in order; the first that does not hold fails the run. */
    private judge(
        step: FlowStep,
        own: ReadonlyArray<FlowResponse>,
        steps: ReadonlyMap<string, ReadonlyArray<FlowResponse>>,
        scope: Record<string, unknown>,
    ): void {
        const before = new Map(steps)
        Object.entries(step.capture).forEach(([name, selector]) => {
            scope[name] = select(selector, { own, steps: before, scope })
        })
        step.expect.forEach((assertion) => {
            const expected = resolveTemplate(assertion.value, scope)
            if (!expected.ok) throw stop("skipped", `needs-${expected.missing}`)
            const actual = select(assertion.that, { own, steps: before, scope })
            if (!holds(assertion.op, actual, expected.value)) {
                throw stop("failed", assertion.fail, {
                    step: step.id,
                    that: assertion.that,
                    actual: textOf(actual ?? null).slice(0, FACT_MAX),
                })
            }
        })
    }
}
