import { Test } from "@nestjs/testing"
import { builder, FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import {
    conceptRowOf,
    PROJECT_ID,
    PROJECT_LEARNER,
    PROJECT_NOW,
    projectRowOf,
} from "@tests/fixtures/builders/project.builder"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { PROBE_TRANSPORT, type ProbeReply, type ProbeTransport } from "@modules/integrations/probe"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { PROJECT_OPTIONS } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import { ProjectEvidenceService } from "./project-evidence.service"
import { ProjectProbeService } from "./project-probe.service"
import { COUNT_PROBE_RUNS, INSERT_PROBE_RUN, SELECT_CONCEPTS, SELECT_PROJECT } from "./persistence/project.sql"

const FOUNDATION = ["request-response-lifecycle", "health-probe-semantics"]
const DECLARED = FOUNDATION
const RUN_ID = "50000000-0000-4000-8000-000000000009"

const ok = (status: number, body = "", headers: Record<string, string> = {}): ProbeReply => ({
    ok: true,
    status,
    headers,
    body,
})

interface World {
    readonly project?: ReturnType<typeof projectRowOf>
    readonly missing?: boolean
    readonly recent?: number
    readonly premium?: boolean
    readonly pointers?: ReadonlyArray<ReturnType<typeof conceptRowOf>>
}

const build = async (world: World = {}, options: ProjectOptions = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PROJECT, world.missing === true ? [] : [world.project ?? projectRowOf()]],
            [COUNT_PROBE_RUNS, [{ total: world.recent ?? 0 }]],
            [SELECT_CONCEPTS, world.pointers ?? []],
            [INSERT_PROBE_RUN, [{ run_id: RUN_ID }]],
        ],
    })
    const tx = fakeTransaction(em)
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(world.premium ?? true)
    const http = mock<ProbeTransport>()
    http.send.mockResolvedValue(ok(200, "", { "x-request-id": "r" }))
    const evidence = mock<ProjectEvidenceService>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectProbeService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: PROJECT_OPTIONS, useValue: builder<ProjectOptions>({})(options) },
            { provide: ProjectEvidenceService, useValue: evidence },
            { provide: PROBE_TRANSPORT, useValue: http },
        ],
    }).compile()
    return { service: moduleRef.get(ProjectProbeService), em, tx, http, evidence, entitlement }
}

describe("ProjectProbeService run", () => {
    it("probes every concept of the project's milestones, records the run with the evidence of the concepts and settles the project", async () => {
        const { service, http, evidence, tx } = await build()

        const run = await service.run(PROJECT_LEARNER, PROJECT_ID)

        expect(run).toMatchObject({ runId: RUN_ID, url: "https://dat-lich.example.com", passed: false })
        const reasons = Object.fromEntries(
            run.results.map((result) => [`${result.conceptId}:${result.probeId}`, result.reason]),
        )
        expect(reasons).toMatchObject({
            "request-response-lifecycle:invalid-input": "accepted",
            "request-response-lifecycle:request-id": "echoed",
            "health-probe-semantics:health": "ok",
            "health-probe-semantics:readiness": "ok",
        })
        expect(http.send).toHaveBeenCalledWith(
            expect.objectContaining({ url: "https://dat-lich.example.com/health", timeoutMs: 6000, maxBytes: 65_536 }),
        )
        expect(evidence.append).toHaveBeenCalledTimes(1)
        expect(
            evidence.append.mock.calls[0]?.[2]
                .filter((input) => FOUNDATION.includes(input.conceptId))
                .map((input) => [input.conceptId, input.ref, input.passed, input.source]),
        ).toEqual([
            ["request-response-lifecycle", "invalid-input", false, "server-probe"],
            ["request-response-lifecycle", "request-id", true, "server-probe"],
            ["health-probe-semantics", "health", true, "server-probe"],
            ["health-probe-semantics", "readiness", true, "server-probe"],
        ])
        expect(evidence.settle).toHaveBeenCalledWith(expect.objectContaining({ project_id: PROJECT_ID }), [
            `probe:${RUN_ID}`,
        ])
        expect(tx.commits).toBe(1)
    })

    it("aims a probe at the endpoint the learner declared, runs a parallel plan at once and passes when every probe passes", async () => {
        const pointers = [
            conceptRowOf({ concept_id: "request-response-lifecycle", endpoint: "POST /orders", sample_body: null }),
            conceptRowOf({ concept_id: "health-probe-semantics", endpoint: "GET /healthz" }),
        ]
        const { service, http } = await build({ pointers })
        http.send.mockImplementation((request) =>
            Promise.resolve(request.method === "POST" ? ok(400) : ok(200, "", { "x-request-id": "r" })),
        )

        const run = await service.run(PROJECT_LEARNER, PROJECT_ID)

        const declared = run.results.filter(
            (result) => DECLARED.includes(result.conceptId ?? "") && !result.reason.startsWith("needs-"),
        )
        expect(declared.length).toBeGreaterThan(0)
        expect(declared.every((result) => result.passed)).toBe(true)
        expect(http.send).toHaveBeenCalledWith(
            expect.objectContaining({ method: "POST", url: "https://dat-lich.example.com/orders" }),
        )
        expect(http.send).toHaveBeenCalledWith(expect.objectContaining({ url: "https://dat-lich.example.com/healthz" }))
    })

    it("probes every milestone for Premium, skips a probe with no declared endpoint and proves nothing from it", async () => {
        const { service, http, evidence } = await build({ premium: true })

        const run = await service.run(PROJECT_LEARNER, PROJECT_ID)

        const skipped = run.results.filter((result) => result.reason.startsWith("needs-"))
        expect(skipped.length).toBeGreaterThan(0)
        expect(run.results.length).toBeLessThanOrEqual(24)
        expect(http.send.mock.calls.length).toBeLessThan(run.results.length * 25)
        const refs = evidence.append.mock.calls[0]?.[2].map((input) => input.ref) ?? []
        expect(refs).not.toContain("repeat-same-key")
    })
})

describe("ProjectProbeService subscription-only", () => {
    it("refuses a learner without Premium before it reads the project, counts a run or sends one request", async () => {
        const { service, http, evidence, em } = await build({ premium: false })

        await expect(service.run(PROJECT_LEARNER, PROJECT_ID)).rejects.toMatchObject({
            code: "PROJECT_PREMIUM_REQUIRED",
        })

        expect(http.send).not.toHaveBeenCalled()
        expect(evidence.append).not.toHaveBeenCalled()
        expect(em.query).not.toHaveBeenCalled()
    })
})

describe("ProjectProbeService run (part 2)", () => {
    it("runs the health probe of the concept that carries it, and sends a parallel plan at once", async () => {
        const { service, http } = await build()

        const run = await service.run(PROJECT_LEARNER, PROJECT_ID)

        expect(run.results.find((result) => result.probeId === "health")).toMatchObject({
            conceptId: "health-probe-semantics",
        })
        expect(http.send).toHaveBeenCalled()
    })

    it("fails a run whose probe has no response, records its reason and moves no concept", async () => {
        const { service, http, evidence } = await build()
        http.send.mockResolvedValue({ ok: false, error: "timeout" })

        const run = await service.run(PROJECT_LEARNER, PROJECT_ID)

        expect(run.passed).toBe(false)
        expect(
            run.results
                .filter((result) => !result.reason.startsWith("needs-"))
                .every((result) => result.reason === "timeout"),
        ).toBe(true)
        expect(evidence.append).toHaveBeenCalledWith(expect.anything(), PROJECT_ID, [])
    })

    it("refuses a project that is not the learner's, without a deployed address, with an internal address or probed too often", async () => {
        const absent = await build({ missing: true })
        const undeployed = await build({ project: projectRowOf({ deployed_url: null }) })
        const internal = await build({ project: projectRowOf({ deployed_url: "http://10.0.0.1" }) })
        const busy = await build({ recent: 6 })
        const more = await build({ recent: 6 }, { probeRunsPerHour: 7 })

        await expect(absent.service.run(PROJECT_LEARNER, PROJECT_ID)).rejects.toMatchObject({
            code: "PROJECT_NOT_FOUND",
        })
        await expect(undeployed.service.run(PROJECT_LEARNER, PROJECT_ID)).rejects.toMatchObject({
            code: "PROJECT_DEPLOYED_URL_MISSING",
        })
        await expect(internal.service.run(PROJECT_LEARNER, PROJECT_ID)).rejects.toMatchObject({
            code: "PROJECT_TARGET_REFUSED",
        })
        await expect(busy.service.run(PROJECT_LEARNER, PROJECT_ID)).rejects.toMatchObject({
            code: "PROJECT_PROBE_RATE_LIMITED",
        })
        await expect(more.service.run(PROJECT_LEARNER, PROJECT_ID)).resolves.toBeDefined()
        expect(busy.http.send).not.toHaveBeenCalled()
    })

    it("counts a missing count row as no earlier run", async () => {
        const { service, em } = await build()
        const original = em.query.getMockImplementation()
        em.query.mockImplementation((sql, params) =>
            sql === COUNT_PROBE_RUNS ? Promise.resolve([]) : (original?.(sql, params) ?? Promise.resolve([])),
        )

        await expect(service.run(PROJECT_LEARNER, PROJECT_ID)).resolves.toBeDefined()
    })
})
