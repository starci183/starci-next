import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
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
import { TIMER } from "@modules/platform/retry"
import { ProjectError } from "./errors/project.error"
import { PROJECT_OPTIONS } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import type { CheckSetFiles } from "./project-check-set.contracts"
import { PROJECT_CHECK_SOURCE, type ProjectCheckSource } from "./project-check-set.port"
import { ProjectCheckSetService } from "./project-check-set.service"
import { ProjectEvidenceService } from "./project-evidence.service"
import { ProjectProbeService } from "./project-probe.service"
import { ProjectProbeSinkService } from "./project-probe-sink.service"
import { COUNT_PROBE_RUNS, INSERT_PROBE_RUN, SELECT_CONCEPTS, SELECT_PROJECT } from "./persistence/project.sql"

const RUN_ID = "50000000-0000-4000-8000-000000000009"
const CHECKS = join(__dirname, "..", "..", "..", "tests", "fixtures", "project-checks")

/** The check set of the content copy the tests carry: the probes are data, read exactly as the server reads them. */
const files: CheckSetFiles = {
    version: "fixture",
    catalog: readFileSync(join(CHECKS, "catalog.yaml"), "utf8"),
    probes: Object.fromEntries(
        readdirSync(join(CHECKS, "probes")).map((name) => [name, readFileSync(join(CHECKS, "probes", name), "utf8")]),
    ),
}

const ok = (status: number, body = "{}", headers: Record<string, string> = {}): ProbeReply => ({
    ok: true,
    status,
    headers,
    body,
})

interface World {
    readonly premium?: boolean
    readonly recent?: number
    readonly pointers?: ReadonlyArray<ReturnType<typeof conceptRowOf>>
    readonly reply?: (url: string) => ProbeReply
}

const build = async (world: World = {}, options: ProjectOptions = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PROJECT, [projectRowOf()]],
            [COUNT_PROBE_RUNS, [{ total: world.recent ?? 0 }]],
            [SELECT_CONCEPTS, world.pointers ?? []],
            [INSERT_PROBE_RUN, [{ run_id: RUN_ID }]],
        ],
    })
    const tx = fakeTransaction(em)
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(world.premium ?? true)
    const http = mock<ProbeTransport>()
    const reply = world.reply ?? (() => ok(200))
    http.send.mockImplementation((request) => Promise.resolve(reply(request.url)))
    const evidence = mock<ProjectEvidenceService>()
    const source: ProjectCheckSource = { read: () => Promise.resolve(files) }
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectProbeService,
            ProjectCheckSetService,
            ProjectProbeSinkService,
            { provide: PROJECT_CHECK_SOURCE, useValue: source },
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: TIMER, useValue: { schedule: (callback: () => void) => (callback(), () => undefined) } },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: PROJECT_OPTIONS, useValue: builder<ProjectOptions>({})(options) },
            { provide: ProjectEvidenceService, useValue: evidence },
            { provide: PROBE_TRANSPORT, useValue: http },
        ],
    }).compile()
    return { service: moduleRef.get(ProjectProbeService), http, evidence }
}

const appended = (evidence: ReturnType<typeof mock<ProjectEvidenceService>>) =>
    (evidence.append.mock.calls[0]?.[2] ?? []) as ReadonlyArray<{
        conceptId: string
        ref: string
        passed: boolean
        detail: Record<string, unknown>
    }>

describe("ProjectProbeService run", () => {
    it("refuses a learner without a subscription before anything is sent", async () => {
        const { service, http } = await build({ premium: false })

        await expect(service.run(PROJECT_LEARNER, PROJECT_ID)).rejects.toMatchObject({
            code: "PROJECT_PREMIUM_REQUIRED",
        })
        expect(http.send).not.toHaveBeenCalled()
    })

    it("runs the data probes of the project's milestones and records evidence only for those that judged", async () => {
        const { service, evidence } = await build({
            pointers: [
                conceptRowOf({ concept_id: "health-probe-semantics", endpoint: "GET /health", sample_body: null }),
            ],
        })

        const run = await service.run(PROJECT_LEARNER, PROJECT_ID)

        const reasons = Object.fromEntries(run.results.map((result) => [result.probeId, result.reason]))
        expect(reasons).toMatchObject({ health: "ok", readiness: "ready", "invalid-input": "needs-endpoint" })
        const rows = appended(evidence)
        expect(rows.map((row) => `${row.conceptId}:${row.ref}`).sort()).toEqual([
            "health-probe-semantics:health",
            "health-probe-semantics:readiness",
        ])
        expect(rows[0]?.detail).toMatchObject({ question: { vi: expect.any(String), en: expect.any(String) } })
        expect(run.passed).toBe(true)
    })

    it("fails a concept whose app answers wrong, with the probe's reason and text", async () => {
        const { service, evidence } = await build({
            pointers: [conceptRowOf({ concept_id: "rate-limiting", endpoint: "GET /items", sample_body: null })],
        })

        const run = await service.run(PROJECT_LEARNER, PROJECT_ID)

        expect(run.results.find((result) => result.probeId === "burst")).toMatchObject({
            passed: false,
            reason: "no-429",
        })
        const burst = appended(evidence).find((row) => row.ref === "burst")
        expect(burst).toMatchObject({ passed: false, detail: { reason: "no-429", text: { en: expect.any(String) } } })
    })

    it("moves no concept when a request gets no response, and skips a sink probe while no sink is declared", async () => {
        const { service, evidence } = await build({
            pointers: [
                conceptRowOf({ concept_id: "health-probe-semantics", endpoint: "GET /health", sample_body: null }),
                conceptRowOf({ concept_id: "transactional-outbox", endpoint: "POST /orders", sample_body: "{}" }),
            ],
            reply: () => ({ ok: false, error: "timeout" }),
        })

        const run = await service.run(PROJECT_LEARNER, PROJECT_ID)

        expect(run.results.find((result) => result.probeId === "health")).toMatchObject({ reason: "timeout" })
        expect(run.results.find((result) => result.probeId === "outbox-delivery")).toMatchObject({
            reason: "needs-sink",
        })
        expect(appended(evidence)).toEqual([])
        expect(run.passed).toBe(false)
    })

    it("refuses a project probed too often", async () => {
        const { service } = await build({ recent: 6 })

        await expect(service.run(PROJECT_LEARNER, PROJECT_ID)).rejects.toBeInstanceOf(ProjectError)
    })
})
