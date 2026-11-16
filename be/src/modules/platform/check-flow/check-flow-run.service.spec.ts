import type { FlowPlugin } from "./check-flow.contracts"
import type { FlowPorts, FlowWireRequest } from "./check-flow.port"
import { CheckFlowRunner } from "./check-flow-run.service"
import { parseCheckFlow } from "./check-flow.schema"

const sent: Array<FlowWireRequest> = []
const ports = (status = 200): FlowPorts => ({
    transport: {
        send: (request) => {
            sent.push(request)
            return Promise.resolve({ ok: true, status, headers: {}, body: "{}" })
        },
    },
    sink: null,
    clock: { now: () => 0, sleep: () => Promise.resolve() },
})
const inputs = { base: "https://learner.example", endpoint: "POST /orders", sample: "{}", runId: "run-1" }

const flowOf = (raw: unknown, plugins: ReadonlyArray<FlowPlugin> = []) => {
    const parsed = parseCheckFlow(raw, undefined, plugins)
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues))
    return parsed.flow
}

const step = (request: Record<string, unknown>) => ({
    id: "flow",
    needs: ["endpoint", "sample"],
    pass: "ok",
    steps: [{ id: "one", request, expect: [{ that: "status", is: "2xx", fail: "bad" }] }],
})

describe("CheckFlowRunner", () => {
    beforeEach(() => sent.splice(0))

    it("refuses at the schema a write that does not go to the declared endpoint", () => {
        const parsed = parseCheckFlow(step({ method: "POST", path: "/admin/delete" }))
        expect(parsed.ok).toBe(false)
    })

    it("skips a write whose resolved path leaves the declared endpoint, sending nothing", async () => {
        const flow = flowOf(step({ method: "{{endpoint.method}}", path: "{{endpoint.path}}" }))
        const verdict = await new CheckFlowRunner(ports()).run(flow, { ...inputs, endpoint: "POST /orders" })
        expect(verdict.status).toBe("passed")
        const outside = await new CheckFlowRunner(ports()).run(
            flowOf(step({ method: "DELETE", path: "{{endpoint.path}}x" })),
            inputs,
        )
        expect(outside).toMatchObject({ status: "skipped", reason: "write-outside-declared-path" })
        expect(sent).toHaveLength(1)
    })

    it("stays on the base address and marks every request with the probe header", async () => {
        const flow = flowOf(step({ method: "GET", path: "/{{endpoint.path}}" }))
        const verdict = await new CheckFlowRunner(ports()).run(flow, inputs)
        expect(verdict).toMatchObject({ status: "skipped", reason: "bad-path" })
        await new CheckFlowRunner(ports()).run(flowOf(step({ method: "GET", path: "{{endpoint.path}}" })), inputs)
        expect(sent[0]).toMatchObject({ url: "https://learner.example/orders", headers: { "x-starci-probe": "run-1" } })
    })

    it("answers unanswered, never failed, when a request gets no response", async () => {
        const flow = flowOf(step({ method: "GET", path: "{{endpoint.path}}" }))
        const silent: FlowPorts = {
            ...ports(),
            transport: { send: () => Promise.resolve({ ok: false, error: "timeout" }) },
        }
        expect(await new CheckFlowRunner(silent).run(flow, inputs)).toMatchObject({
            status: "unanswered",
            reason: "timeout",
        })
    })

    it("refuses a primitive step where no primitive is registered, and runs it where one is", async () => {
        const raw = {
            id: "doctor",
            needs: [],
            pass: "ok",
            steps: [{ id: "file", "file.exists": "README.md", expect: [{ that: "status", eq: 0, fail: "missing" }] }],
        }
        expect(parseCheckFlow(raw).ok).toBe(false)
        const plugin: FlowPlugin = {
            key: "file.exists",
            parse: (value) => value,
            perform: () => Promise.resolve({ status: 0, headers: {}, body: "", ms: 0 }),
        }
        const verdict = await new CheckFlowRunner(ports(), [plugin]).run(flowOf(raw, [plugin]), inputs)
        expect(verdict).toMatchObject({ status: "passed", reason: "ok" })
    })
})
