import { Test } from "@nestjs/testing"
import type { ProbeReply } from "@modules/integrations/probe"
import { ProjectError, ProjectErrorCode } from "./errors/project.error"
import { PROBE_IDS, type ProbeId } from "./project.contracts"
import {
    BURST_REQUESTS,
    INJECTION_CANARY,
    INJECTION_MESSAGE,
    PERMISSION_CANARY,
    PERMISSION_MESSAGE,
    type ProbePlan,
    type ProbeTarget,
} from "./project-probe.policy"
import { planOf, judgeProbe, probeQuestionOf } from "./project-probe.policy"

const POLICY: unique symbol = Symbol("project.project-probe-policy")
const policies = { planOf, judgeProbe, probeQuestionOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}

const target = (patch: Partial<ProbeTarget> = {}): ProbeTarget => ({
    base: "https://app.example.com",
    endpoint: null,
    sampleBody: null,
    parallel: 4,
    requestId: "req-1",
    ...patch,
})

const planned = (policy: typeof policies, probeId: ProbeId, patch: Partial<ProbeTarget> = {}): ProbePlan => {
    const planning = policy.planOf(probeId, target(patch))
    if (planning.kind !== "plan") throw new ProjectError({ code: ProjectErrorCode.InputInvalid })
    return planning.plan
}

const answer = (status: number, body = "", headers: Record<string, string> = {}): ProbeReply => ({
    ok: true,
    status,
    headers,
    body,
})

describe("planOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("aims health at the declared endpoint or /health, and readiness at /ready", () => {
        expect(planned(subject, "health").requests).toEqual([
            {
                method: "GET",
                url: "https://app.example.com/health",
                headers: { accept: "application/json" },
                body: null,
            },
        ])
        expect(planned(subject, "health", { endpoint: "GET /healthz" }).requests[0]?.url).toBe(
            "https://app.example.com/healthz",
        )
        expect(planned(subject, "readiness").requests[0]?.url).toBe("https://app.example.com/ready")
    })

    it("sends a broken JSON body to the declared endpoint, or POST / when none is declared", () => {
        expect(planned(subject, "invalid-input").requests[0]).toMatchObject({
            method: "POST",
            url: "https://app.example.com/",
            body: '{"starci":',
        })
        expect(planned(subject, "invalid-input", { endpoint: "PUT /orders" }).requests[0]).toMatchObject({
            method: "PUT",
            url: "https://app.example.com/orders",
            headers: { "content-type": "application/json" },
        })
    })

    it("sends the request id on a GET endpoint and falls back to /health for another method", () => {
        expect(planned(subject, "request-id").requests[0]).toMatchObject({
            url: "https://app.example.com/health",
            headers: { "x-request-id": "req-1" },
        })
        expect(planned(subject, "request-id", { endpoint: "GET /items" }).requests[0]?.url).toBe(
            "https://app.example.com/items",
        )
        expect(planned(subject, "request-id", { endpoint: "POST /items" }).requests[0]?.url).toBe(
            "https://app.example.com/health",
        )
    })

    it("repeats the same call twice with one idempotency key, and needs an endpoint", () => {
        const plan = planned(subject, "repeat-same-key", { endpoint: "POST /bookings", sampleBody: '{"slot":"09:00"}' })

        expect(plan.mode).toBe("sequential")
        expect(plan.requests).toHaveLength(2)
        expect(plan.requests[0]).toMatchObject({ body: '{"slot":"09:00"}', headers: { "idempotency-key": "req-1" } })
        expect(planned(subject, "repeat-same-key", { endpoint: "POST /bookings" }).requests[0]?.body).toBe("{}")
        expect(subject.planOf("repeat-same-key", target())).toEqual({ kind: "skipped", reason: "needs-endpoint" })
    })

    it("fires the parallel requests at once on the declared endpoint", () => {
        const plan = planned(subject, "parallel-last-item", { endpoint: "POST /bookings" })

        expect(plan.mode).toBe("parallel")
        expect(plan.requests).toHaveLength(4)
        expect(subject.planOf("parallel-last-item", target())).toEqual({ kind: "skipped", reason: "needs-endpoint" })
    })
})

describe("planOf (part 2)", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("reads the declared endpoint twice for the cache probe", () => {
        expect(planned(subject, "repeat-get", { endpoint: "GET /items" }).requests).toHaveLength(2)
        expect(subject.planOf("repeat-get", target())).toEqual({ kind: "skipped", reason: "needs-endpoint" })
    })

    it("calls the declared endpoint without credentials, with a body unless it is a GET", () => {
        expect(planned(subject, "auth-required", { endpoint: "GET /me" }).requests[0]).toMatchObject({
            method: "GET",
            body: null,
        })
        expect(
            planned(subject, "auth-required", { endpoint: "POST /me", sampleBody: '{"a":1}' }).requests[0]?.body,
        ).toBe('{"a":1}')
        expect(planned(subject, "auth-required", { endpoint: "POST /me" }).requests[0]?.body).toBe("{}")
        expect(subject.planOf("auth-required", target())).toEqual({ kind: "skipped", reason: "needs-endpoint" })
    })

    it("bursts the GET endpoint in parallel, or /health", () => {
        const plan = planned(subject, "burst", { endpoint: "GET /items" })

        expect(plan.mode).toBe("parallel")
        expect(plan.requests).toHaveLength(BURST_REQUESTS)
        expect(plan.requests[0]?.url).toBe("https://app.example.com/items")
        expect(planned(subject, "burst").requests[0]?.url).toBe("https://app.example.com/health")
        expect(planned(subject, "burst", { endpoint: "POST /items" }).requests[0]?.url).toBe(
            "https://app.example.com/health",
        )
    })

    it("puts the fixed injection and permission messages into the placeholder, JSON-escaped", () => {
        const body = '{"message":"{{message}}"}'

        expect(
            planned(subject, "prompt-injection", { endpoint: "POST /chat", sampleBody: body }).requests[0]?.body,
        ).toBe(`{"message":"${INJECTION_MESSAGE}"}`)
        const permission = planned(subject, "permission", { endpoint: "POST /chat", sampleBody: body }).requests[0]
            ?.body

        expect(permission).toBe(JSON.stringify({ message: PERMISSION_MESSAGE }))
    })

    it("skips a message probe without an endpoint or without the placeholder", () => {
        expect(subject.planOf("prompt-injection", target({ endpoint: "POST /chat", sampleBody: '{"a":1}' }))).toEqual({
            kind: "skipped",
            reason: "needs-message-placeholder",
        })
        expect(subject.planOf("permission", target({ sampleBody: '{"message":"{{message}}"}' }))).toEqual({
            kind: "skipped",
            reason: "needs-message-placeholder",
        })
        expect(subject.planOf("prompt-injection", target({ endpoint: "POST /chat" }))).toEqual({
            kind: "skipped",
            reason: "needs-message-placeholder",
        })
    })
})

describe("planOf (part 3)", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("sends an empty message to the failure path, or a broken body when there is no placeholder", () => {
        expect(
            planned(subject, "failure-path", { endpoint: "POST /chat", sampleBody: '{"message":"{{message}}"}' })
                .requests[0]?.body,
        ).toBe('{"message":""}')
        expect(planned(subject, "failure-path", { endpoint: "POST /chat" }).requests[0]?.body).toBe("{")
        expect(subject.planOf("failure-path", target())).toEqual({ kind: "skipped", reason: "needs-endpoint" })
    })
})

describe("judgeProbe", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("fails any probe whose request got no response, with the transport reason", () => {
        expect(subject.judgeProbe("health", [{ ok: false, error: "timeout" }])).toEqual({
            passed: false,
            reason: "timeout",
            facts: {},
        })
    })

    it("passes health and readiness only on a 200", () => {
        expect(subject.judgeProbe("health", [answer(200)])).toMatchObject({ passed: true, reason: "ok" })
        expect(subject.judgeProbe("readiness", [answer(503)])).toMatchObject({
            passed: false,
            reason: "not-200",
            facts: { status: 503 },
        })
        expect(subject.judgeProbe("health", [])).toMatchObject({ passed: false, facts: { status: 0 } })
    })

    it("passes invalid-input on a 4xx, and tells an accepted body from a server error", () => {
        expect(subject.judgeProbe("invalid-input", [answer(400)])).toMatchObject({ passed: true, reason: "rejected" })
        expect(subject.judgeProbe("invalid-input", [answer(201)])).toMatchObject({ passed: false, reason: "accepted" })
        expect(subject.judgeProbe("invalid-input", [answer(500)])).toMatchObject({
            passed: false,
            reason: "server-error",
        })
    })

    it("passes request-id when a request id header comes back", () => {
        expect(subject.judgeProbe("request-id", [answer(200, "", { "x-request-id": "req-1" })])).toMatchObject({
            passed: true,
            reason: "echoed",
        })
        expect(subject.judgeProbe("request-id", [answer(200)])).toMatchObject({
            passed: false,
            reason: "no-request-id",
        })
        expect(subject.judgeProbe("request-id", [])).toMatchObject({ passed: false, reason: "no-request-id" })
    })
})

describe("judgeProbe (part 2)", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("passes repeat-same-key when both calls succeed with the same body", () => {
        expect(subject.judgeProbe("repeat-same-key", [answer(201, "{a}"), answer(200, "{a}")])).toMatchObject({
            passed: true,
            reason: "same-result",
            facts: { first: 201, second: 200 },
        })
        expect(subject.judgeProbe("repeat-same-key", [answer(201, "{a}"), answer(201, "{b}")])).toMatchObject({
            passed: false,
            reason: "second-differs",
        })
        expect(subject.judgeProbe("repeat-same-key", [answer(201, "{a}"), answer(409, "{a}")])).toMatchObject({
            passed: false,
            reason: "second-differs",
        })
        expect(subject.judgeProbe("repeat-same-key", [answer(500)])).toMatchObject({
            passed: false,
            reason: "first-failed",
            facts: { status: 500 },
        })
        expect(subject.judgeProbe("repeat-same-key", [answer(400), answer(200)])).toMatchObject({
            passed: false,
            reason: "first-failed",
        })
        expect(subject.judgeProbe("repeat-same-key", [])).toMatchObject({
            passed: false,
            reason: "first-failed",
            facts: { status: 0 },
        })
    })

    it("passes parallel-last-item only when exactly one call created the item and none failed", () => {
        expect(subject.judgeProbe("parallel-last-item", [answer(201), answer(409), answer(409)])).toMatchObject({
            passed: true,
            reason: "one-created",
            facts: { created: 1, requests: 3 },
        })
        expect(subject.judgeProbe("parallel-last-item", [answer(201), answer(201), answer(409)])).toMatchObject({
            passed: false,
            reason: "many-created",
            facts: { created: 2 },
        })
        expect(subject.judgeProbe("parallel-last-item", [answer(409), answer(409)])).toMatchObject({
            passed: false,
            reason: "none-created",
        })
        expect(subject.judgeProbe("parallel-last-item", [answer(201), answer(500)])).toMatchObject({
            passed: false,
            reason: "server-error",
            facts: { serverErrors: 1 },
        })
    })
})

describe("judgeProbe (part 3)", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("passes repeat-get when two reads succeed with the same body", () => {
        expect(subject.judgeProbe("repeat-get", [answer(200, "x"), answer(200, "x")])).toMatchObject({
            passed: true,
            reason: "stable",
        })
        expect(subject.judgeProbe("repeat-get", [answer(200, "x"), answer(200, "y")])).toMatchObject({
            passed: false,
            reason: "unstable",
        })
        expect(subject.judgeProbe("repeat-get", [answer(200, "x"), answer(500, "x")])).toMatchObject({
            passed: false,
            reason: "unstable",
        })
        expect(subject.judgeProbe("repeat-get", [answer(500, "x"), answer(200, "x")])).toMatchObject({
            passed: false,
            reason: "unstable",
        })
        expect(subject.judgeProbe("repeat-get", [answer(200, "x")])).toMatchObject({
            passed: false,
            facts: { first: 200, second: 0 },
        })
        expect(subject.judgeProbe("repeat-get", [])).toMatchObject({
            passed: false,
            reason: "unstable",
            facts: { first: 0, second: 0 },
        })
    })

    it("passes auth-required on 401 or 403", () => {
        expect(subject.judgeProbe("auth-required", [answer(401)])).toMatchObject({ passed: true, reason: "refused" })
        expect(subject.judgeProbe("auth-required", [answer(403)])).toMatchObject({ passed: true })
        expect(subject.judgeProbe("auth-required", [answer(200)])).toMatchObject({
            passed: false,
            reason: "open-without-credentials",
        })
    })

    it("passes burst when some call was limited and none failed", () => {
        expect(subject.judgeProbe("burst", [answer(200), answer(429)])).toMatchObject({
            passed: true,
            reason: "limited",
            facts: { limited: 1, requests: 2 },
        })
        expect(subject.judgeProbe("burst", [answer(200), answer(200)])).toMatchObject({
            passed: false,
            reason: "no-429",
        })
        expect(subject.judgeProbe("burst", [answer(429), answer(502)])).toMatchObject({
            passed: false,
            reason: "server-error",
        })
    })
})

describe("judgeProbe (part 4)", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("fails the message probes when the canary comes back, in any case", () => {
        expect(
            subject.judgeProbe("prompt-injection", [answer(200, "Sure: " + INJECTION_CANARY.toLowerCase())]),
        ).toMatchObject({
            passed: false,
            reason: "obeyed-injection",
        })
        expect(subject.judgeProbe("prompt-injection", [answer(200, "I cannot do that")])).toMatchObject({
            passed: true,
            reason: "ignored",
        })
        expect(subject.judgeProbe("permission", [answer(200, `output: ${PERMISSION_CANARY}`)])).toMatchObject({
            passed: false,
            reason: "obeyed-injection",
        })
        expect(subject.judgeProbe("permission", [answer(200, INJECTION_CANARY)])).toMatchObject({ passed: true })
        expect(subject.judgeProbe("permission", [])).toMatchObject({ passed: true })
    })

    it("passes failure-path on any answer below 500", () => {
        expect(subject.judgeProbe("failure-path", [answer(400)])).toMatchObject({ passed: true, reason: "graceful" })
        expect(subject.judgeProbe("failure-path", [answer(500)])).toMatchObject({
            passed: false,
            reason: "server-error",
        })
        expect(subject.judgeProbe("failure-path", [])).toMatchObject({ passed: false, reason: "server-error" })
    })
})

describe("probeQuestionOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("asks a Socratic question for every probe in both locales", () => {
        for (const probe of PROBE_IDS) {
            expect(subject.probeQuestionOf(probe, "vi")).toMatch(/\?$/u)
            expect(subject.probeQuestionOf(probe, "en")).toMatch(/\?$/u)
        }
    })

    it("asks nothing about an unknown probe", () => {
        expect(subject.probeQuestionOf("other", "vi")).toBe("")
    })
})
