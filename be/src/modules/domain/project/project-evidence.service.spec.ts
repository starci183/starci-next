import { Test } from "@nestjs/testing"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import {
    evidenceDbRowOf,
    evidenceOf,
    PROJECT_ID,
    PROJECT_LEARNER,
    PROJECT_NOW,
    probeRunRowOf,
    projectRowOf,
} from "@tests/fixtures/builders/project.builder"
import { EssentialsExperienceService, EXPERIENCE_PRODUCER, type ExperienceProducer } from "@modules/domain/career"
import { NOTIFICATION_PRODUCER, type NotificationProducerPort } from "@modules/domain/notification"
import { StreakService } from "@modules/domain/streak"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER, type Logger } from "@modules/platform/logging"
import type { ConceptLessonRef } from "./project.contracts"
import { ProjectEvidenceService } from "./project-evidence.service"
import { PROJECT_LESSONS, type ProjectLessonPort } from "./project-lesson.port"
import {
    INSERT_CI_RUN,
    INSERT_EVIDENCE,
    INSERT_PROOFS,
    SELECT_EVIDENCE,
    SELECT_LAST_PROBE_RUNS,
} from "./persistence/project.sql"

/** Every subject the proved rows of the foundation milestone stand on. */
const ALL_SUBJECTS: ReadonlyArray<string> = [
    "concept:request-response-lifecycle",
    "concept:health-probe-semantics",
    "concept:unit-testing-behavior",
    "milestone:bf-http-foundation",
    "milestone:ops-run-a-service",
    "deployed",
]

const FOUNDATION = ["request-response-lifecycle", "health-probe-semantics", "unit-testing-behavior"]
const LESSONS = new Map<string, ConceptLessonRef>(
    FOUNDATION.map((id) => [id, { id, version: "v1", title: id, topicId: "topic" }]),
)

const provedRows = () => [
    evidenceDbRowOf({ concept_id: "request-response-lifecycle", slot: "test" }),
    evidenceDbRowOf({
        concept_id: "request-response-lifecycle",
        slot: "probe",
        source: "server-probe",
        ref: "invalid-input",
        run_id: "p1",
    }),
    evidenceDbRowOf({ concept_id: "health-probe-semantics", slot: "test", ref: "[health] ok" }),
    evidenceDbRowOf({
        concept_id: "health-probe-semantics",
        slot: "probe",
        source: "server-probe",
        ref: "health",
        run_id: "p1",
    }),
    evidenceDbRowOf({ concept_id: "unit-testing-behavior", slot: "test", ref: "[unit] a" }),
    evidenceDbRowOf({
        concept_id: "unit-testing-behavior",
        slot: "code-read",
        source: "ai",
        ref: "src/a.go",
        run_id: "r1",
    }),
]

interface World {
    readonly evidence?: ReadonlyArray<ReturnType<typeof evidenceDbRowOf>>
    readonly probeRuns?: ReadonlyArray<ReturnType<typeof probeRunRowOf>>
    readonly claimed?: ReadonlyArray<string> | "all"
}

const build = async (world: World = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_EVIDENCE, world.evidence ?? []],
            [SELECT_LAST_PROBE_RUNS, world.probeRuns ?? []],
            [INSERT_PROOFS, []],
            [INSERT_EVIDENCE, [{ evidence_id: "e" }]],
            [INSERT_CI_RUN, [{ run_id: "run-1" }]],
        ],
    })
    em.query.mockImplementation((sql: unknown) => {
        if (sql === SELECT_EVIDENCE) return Promise.resolve(world.evidence ?? [])
        if (sql === SELECT_LAST_PROBE_RUNS) return Promise.resolve(world.probeRuns ?? [])
        if (sql === INSERT_PROOFS) {
            const claimed = world.claimed === "all" ? ALL_SUBJECTS : (world.claimed ?? [])
            return Promise.resolve(claimed.map((subject) => ({ subject })))
        }
        if (sql === INSERT_EVIDENCE) return Promise.resolve([{ evidence_id: "e" }])
        return Promise.resolve([{ run_id: "run-1" }])
    })
    const tx = fakeTransaction(em)
    const lessons = mock<ProjectLessonPort>()
    lessons.lessons.mockResolvedValue(LESSONS)
    const experiences = mock<ExperienceProducer>()
    const essentials = mock<EssentialsExperienceService>()
    const notifications = mock<NotificationProducerPort>()
    const streak = mock<StreakService>()
    const logger = mock<Logger>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectEvidenceService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: LOGGER, useValue: logger },
            { provide: PROJECT_LESSONS, useValue: lessons },
            { provide: EssentialsExperienceService, useValue: essentials },
            { provide: NOTIFICATION_PRODUCER, useValue: notifications },
            { provide: StreakService, useValue: streak },
            { provide: EXPERIENCE_PRODUCER, useValue: experiences },
        ],
    }).compile()
    return {
        service: moduleRef.get(ProjectEvidenceService),
        em,
        tx,
        experiences,
        essentials,
        notifications,
        streak,
        logger,
    }
}

describe("ProjectEvidenceService append", () => {
    it("appends each result in the caller's transaction and counts the new ones", async () => {
        const { service, em } = await build()

        const added = await service.append(em, PROJECT_ID, [
            evidenceOf({ detail: { a: 1 } }),
            evidenceOf({ ref: "b", commitSha: null }),
        ])

        expect(added).toBe(2)
        expect(em.query).toHaveBeenCalledWith(INSERT_EVIDENCE, [
            PROJECT_ID,
            "idempotency",
            "test",
            "ci",
            true,
            "[idempotency] booking twice with the same key",
            "run-1",
            "abc1234def",
            '{"a":1}',
            new Date("2026-11-08T09:00:00.000Z"),
        ])
    })

    it("adds nothing for no result", async () => {
        const { service, em } = await build()

        await expect(service.append(em, PROJECT_ID, [])).resolves.toBe(0)
    })
})

describe("ProjectEvidenceService recordCiRun", () => {
    const RUN = {
        projectId: PROJECT_ID,
        runId: "run-1",
        commit: "abc1234",
        passed: true,
        attestation: "attested" as const,
        results: [evidenceOf()],
    }

    it("records a new run with its attestation and its results in one transaction", async () => {
        const { service, tx, em } = await build()

        await expect(service.recordCiRun(RUN)).resolves.toEqual({ duplicate: false, added: 1 })
        expect(tx.commits).toBe(1)
        expect(em.query).toHaveBeenCalledWith(INSERT_CI_RUN, [
            PROJECT_ID,
            "run-1",
            "abc1234",
            true,
            expect.anything(),
            "attested",
        ])
    })

    it("adds nothing for a run id seen before", async () => {
        const { service, em } = await build()
        em.query.mockImplementation(() => Promise.resolve([]))

        await expect(service.recordCiRun(RUN)).resolves.toEqual({ duplicate: true, added: 0 })
    })
})

describe("ProjectEvidenceService settle", () => {
    it("claims nothing and does nothing for a project with no proof", async () => {
        const { service, em, essentials, streak } = await build()

        await service.settle(projectRowOf(), [])

        expect(em.query).not.toHaveBeenCalledWith(INSERT_PROOFS, expect.anything())
        expect(essentials.record).not.toHaveBeenCalled()
        expect(streak.recordStreakAction).not.toHaveBeenCalled()
    })

    it("hands every newly claimed proof to the rest of the app and counts each run once for the streak", async () => {
        const { service, experiences, essentials, notifications, streak } = await build({
            evidence: provedRows(),
            probeRuns: [probeRunRowOf()],
            claimed: "all",
        })

        await service.settle(projectRowOf(), ["ci:run-1", "probe:p1"])

        expect(essentials.record).toHaveBeenCalledTimes(3)
        expect(essentials.record).toHaveBeenCalledWith({
            learnerId: PROJECT_LEARNER,
            lessonId: "request-response-lifecycle",
            project: { projectId: PROJECT_ID, title: "Clinic booking", language: "go" },
        })
        expect(experiences.produce).toHaveBeenCalledTimes(3)
        expect(experiences.produce).toHaveBeenCalledWith(
            expect.objectContaining({ itemType: "projects.milestone", subject: `bf-http-foundation@${PROJECT_ID}` }),
        )
        expect(experiences.produce).toHaveBeenCalledWith(expect.objectContaining({ itemType: "projects.deployed" }))
        expect(notifications.notify).toHaveBeenCalledWith(
            PROJECT_LEARNER,
            "project.milestone-proved",
            { project: "Clinic booking", milestone: "bf-http-foundation" },
            `/projects/${PROJECT_ID}/bf-http-foundation`,
        )
        expect(notifications.notify).toHaveBeenCalledWith(
            PROJECT_LEARNER,
            "project.deployed",
            { project: "Clinic booking" },
            `/projects/${PROJECT_ID}`,
        )
        expect(streak.recordStreakAction).toHaveBeenCalledWith(PROJECT_LEARNER, "projects", "project-run", {
            actionId: "ci:run-1",
        })
        expect(streak.recordStreakAction).toHaveBeenCalledWith(PROJECT_LEARNER, "projects", "project-run", {
            actionId: "probe:p1",
        })
    })

    it("acts only on the proofs it claims for the first time", async () => {
        const { service, experiences, essentials } = await build({
            evidence: provedRows(),
            claimed: ["concept:unit-testing-behavior"],
        })

        await service.settle(projectRowOf(), [])

        expect(essentials.record).toHaveBeenCalledTimes(1)
        expect(experiences.produce).not.toHaveBeenCalled()
    })
})

describe("ProjectEvidenceService settle (part 2)", () => {
    it("does not count a failed probe run as a deployment, and knows an agent's track", async () => {
        const { service, experiences } = await build({
            evidence: provedRows(),
            probeRuns: [probeRunRowOf({ passed: false })],
            claimed: "all",
        })

        await service.settle(projectRowOf({ kind: "agent", track: "hermes" }), [])

        expect(experiences.produce).not.toHaveBeenCalledWith(expect.objectContaining({ itemType: "projects.deployed" }))
    })

    it("logs a failing side effect and goes on to the next", async () => {
        const { service, essentials, experiences, notifications, streak, logger } = await build({
            evidence: provedRows(),
            probeRuns: [probeRunRowOf()],
            claimed: "all",
        })
        essentials.record.mockRejectedValue(new TypeError("boom"))
        experiences.produce.mockRejectedValue("not an error")
        streak.recordStreakAction.mockRejectedValue(new Error("down"))

        await service.settle(projectRowOf(), ["ci:run-1"])

        expect(logger.warn).toHaveBeenCalledWith("project.proof_effect_failed", {
            subject: "concept:request-response-lifecycle",
            error: "TypeError",
        })
        expect(logger.warn).toHaveBeenCalledWith("project.proof_effect_failed", {
            subject: "deployed",
            error: "unknown",
        })
        expect(logger.warn).toHaveBeenCalledWith("project.proof_effect_failed", { subject: "ci:run-1", error: "Error" })
        expect(notifications.notify).not.toHaveBeenCalled()
    })
})
