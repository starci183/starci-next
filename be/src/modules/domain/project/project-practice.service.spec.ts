import { Test } from "@nestjs/testing"
import { fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import {
    PROJECT_ID,
    projectViewOf,
    PROJECT_LEARNER,
    projectRowOf,
    relayResultOf,
} from "@tests/fixtures/builders/project.builder"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import type { RelayCheckResult } from "./project.contracts"
import { ProjectEvidenceService } from "./project-evidence.service"
import { ProjectPracticeService } from "./project-practice.service"
import type { ProjectLookupParams } from "./project-params.contracts"
import { ProjectReadService } from "./project-read.service"
import { PROJECT_RELAY, type ProjectRelayPort } from "./project-relay.port"
import { SELECT_PROJECT, SELECT_RELAY_CURSOR } from "./persistence/project.sql"

const LOOKUP: ProjectLookupParams = { learnerId: PROJECT_LEARNER, projectId: PROJECT_ID, locale: "en" }
const VIEW = projectViewOf()

const build = async (options: { missing?: boolean; cursor?: Date | null; added?: number } = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PROJECT, options.missing === true ? [] : [projectRowOf()]],
            [SELECT_RELAY_CURSOR, options.cursor === undefined ? [] : [{ cursor: options.cursor }]],
        ],
    })
    const tx = fakeTransaction(em)
    const relay = mock<ProjectRelayPort>()
    const evidence = mock<ProjectEvidenceService>()
    evidence.append.mockResolvedValue(options.added ?? 1)
    const reads = mock<ProjectReadService>()
    reads.get.mockResolvedValue(VIEW)
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectPracticeService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: LOGGER, useValue: logger },
            { provide: PROJECT_RELAY, useValue: relay },
            { provide: ProjectEvidenceService, useValue: evidence },
            { provide: ProjectReadService, useValue: reads },
        ],
    }).compile()
    return { service: moduleRef.get(ProjectPracticeService), relay, evidence, reads, logger, tx }
}

const results = (): ReadonlyArray<RelayCheckResult> => [
    relayResultOf(),
    relayResultOf({ eventId: "evt-2", ref: "b", conceptId: "request-response-lifecycle", slot: "probe" }),
    relayResultOf({ eventId: "evt-3", runId: "relay-run-2" }),
    relayResultOf({ eventId: "evt-4", conceptId: "agent-harness-control-loop" }),
    relayResultOf({ eventId: "evt-5", slot: "code-read" }),
]

describe("ProjectPracticeService sync", () => {
    it("appends the new relay results of the project's concepts as practice, counts each run for the streak and answers the project", async () => {
        const { service, relay, evidence, reads, tx } = await build({ cursor: new Date("2026-11-08T07:00:00.000Z") })
        relay.checkResults.mockResolvedValue(results())

        await expect(service.sync(LOOKUP)).resolves.toBe(VIEW)

        expect(relay.checkResults).toHaveBeenCalledWith({
            learnerId: PROJECT_LEARNER,
            projectId: PROJECT_ID,
            after: new Date("2026-11-08T07:00:00.000Z"),
        })
        const inputs = evidence.append.mock.calls[0]?.[2] ?? []
        expect(inputs.map((input) => [input.conceptId, input.slot, input.source, input.runId])).toEqual([
            ["idempotency", "test", "relay", "relay-run-1"],
            ["request-response-lifecycle", "probe", "relay", "relay-run-1"],
            ["idempotency", "test", "relay", "relay-run-2"],
        ])
        expect(inputs[0]).toMatchObject({ detail: { eventId: "evt-1" }, commitSha: "abc1234" })
        expect(evidence.settle).toHaveBeenCalledWith(expect.objectContaining({ project_id: PROJECT_ID }), [
            `relay:${PROJECT_ID}:relay-run-1`,
            `relay:${PROJECT_ID}:relay-run-2`,
        ])
        expect(reads.get).toHaveBeenCalledWith(LOOKUP)
        expect(tx.commits).toBe(1)
    })

    it("pulls everything the first time", async () => {
        const { service, relay } = await build()
        relay.checkResults.mockResolvedValue([])

        await service.sync(LOOKUP)

        expect(relay.checkResults).toHaveBeenCalledWith(expect.objectContaining({ after: null }))
    })

    it("does not settle when nothing is reported or every event was seen before", async () => {
        const none = await build()
        none.relay.checkResults.mockResolvedValue([])
        const seen = await build({ added: 0 })
        seen.relay.checkResults.mockResolvedValue([relayResultOf()])

        await none.service.sync(LOOKUP)
        await seen.service.sync(LOOKUP)

        expect(none.evidence.append).not.toHaveBeenCalled()
        expect(none.evidence.settle).not.toHaveBeenCalled()
        expect(seen.evidence.settle).not.toHaveBeenCalled()
    })

    it("logs a relay that fails and answers the project as it was", async () => {
        const { service, relay, logger, evidence } = await build()
        relay.checkResults.mockRejectedValueOnce(new TypeError("down"))
        relay.checkResults.mockRejectedValueOnce("odd")

        await expect(service.sync(LOOKUP)).resolves.toBe(VIEW)
        await expect(service.sync(LOOKUP)).resolves.toBe(VIEW)

        expect(logger.warn).toHaveBeenCalledWith("project.relay_failed", { error: "TypeError" })
        expect(logger.warn).toHaveBeenCalledWith("project.relay_failed", { error: "unknown" })
        expect(evidence.append).not.toHaveBeenCalled()
    })

    it("does not find a project that is not the learner's", async () => {
        const { service, relay } = await build({ missing: true })

        await expect(service.sync(LOOKUP)).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
        expect(relay.checkResults).not.toHaveBeenCalled()
    })
})
