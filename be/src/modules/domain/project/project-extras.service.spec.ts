import { Test } from "@nestjs/testing"
import { checkSetServiceOf } from "@tests/fixtures/builders/check-set.builder"
import { ProjectCheckSetService } from "@modules/domain/project/project-check-set.service"
import { FakeClock, mock, mockEntityManager } from "@starci/jest-preset"
import {
    evidenceDbRowOf,
    PROJECT_ID,
    PROJECT_LEARNER,
    PROJECT_NOW,
    projectRowOf,
} from "@tests/fixtures/builders/project.builder"
import { EssentialsExperienceService, type ProduceExperienceParams } from "@modules/domain/career"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import type { ConceptLessonRef } from "./project.contracts"
import { ProjectExtrasService } from "./project-extras.service"
import { PROJECT_LESSONS, type ProjectLessonPort } from "./project-lesson.port"
import { SELECT_EVIDENCE, SELECT_PROJECT } from "./persistence/project.sql"

const SAGA_LESSON: ConceptLessonRef = { id: "unit-testing-behavior", version: "v1", title: "Saga", topicId: "t" }
const TEST_LESSON: ConceptLessonRef = { id: "idempotent-retry", version: "v1", title: "Idempotency", topicId: "t" }
const HASH = "a".repeat(64)

const readRow = (patch: Partial<ReturnType<typeof evidenceDbRowOf>> = {}) =>
    evidenceDbRowOf({
        concept_id: "unit-testing-behavior",
        slot: "code-read",
        source: "ai",
        run_id: "read-1",
        ref: "internal/saga.go",
        at: new Date("2026-11-08T09:00:00.000Z"),
        detail: {
            reason: "read-passed",
            facts: { mean: 1.5 },
            levels: [
                { criterionId: "c1", level: 2, evidenceQuote: "compensates on failure" },
                { criterionId: "c2", level: 1, evidenceQuote: "retries" },
                { criterionId: "c3", level: 0, evidenceQuote: "" },
            ],
            question: "Where does it compensate?",
            excerptHash: HASH,
        },
        ...patch,
    })

interface World {
    readonly premium?: boolean
    readonly missing?: boolean
    readonly evidence?: ReadonlyArray<ReturnType<typeof evidenceDbRowOf>>
    readonly lessons?: ReadonlyArray<ConceptLessonRef>
}

const build = async (world: World = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PROJECT, world.missing === true ? [] : [projectRowOf()]],
            [SELECT_EVIDENCE, world.evidence ?? []],
        ],
    })
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(world.premium ?? true)
    const lessons = mock<ProjectLessonPort>()
    lessons.lessons.mockResolvedValue(new Map((world.lessons ?? [SAGA_LESSON, TEST_LESSON]).map((l) => [l.id, l])))
    lessons.rubricOf.mockResolvedValue({
        criteria: [
            { id: "c1", criterion: "Compensation on failure", expectedEvidence: "SECRET-1", misconception: "SECRET-2" },
            { id: "c2", criterion: "Retry policy", expectedEvidence: "SECRET-3", misconception: "SECRET-4" },
        ],
    })
    const essentials = mock<EssentialsExperienceService>()
    const draft: ProduceExperienceParams = {
        learnerId: PROJECT_LEARNER,
        itemType: "essentials.concept-proved",
        subject: "idempotency@p",
        projectId: PROJECT_ID,
        evidence: [],
        slotValues: {
            vi: { concept: "Idempotency", project: "Clinic booking", language: "go", lesson: "idempotent-retry" },
            en: { concept: "Idempotency", project: "Clinic booking", language: "go", lesson: "idempotent-retry" },
        },
        grade: { result: "pass", criteria: [] },
    }
    essentials.preview.mockResolvedValue(draft)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectExtrasService,
            { provide: ProjectCheckSetService, useValue: checkSetServiceOf() },
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: PROJECT_LESSONS, useValue: lessons },
            { provide: EssentialsExperienceService, useValue: essentials },
        ],
    }).compile()
    return { service: moduleRef.get(ProjectExtrasService), em, essentials, lessons }
}

const READ = {
    learnerId: PROJECT_LEARNER,
    projectId: PROJECT_ID,
    conceptId: "unit-testing-behavior",
    locale: "en",
} as const
const PREVIEW = {
    learnerId: PROJECT_LEARNER,
    projectId: PROJECT_ID,
    conceptId: null,
    milestoneId: null,
    locale: "en",
} as const

describe("ProjectExtrasService is subscription-only", () => {
    it("refuses the code read and the CV preview of a learner without Premium before it reads anything", async () => {
        const { service, em, essentials } = await build({ premium: false, evidence: [readRow()] })

        await expect(service.codeRead(READ)).rejects.toMatchObject({ code: "PROJECT_PREMIUM_REQUIRED" })
        await expect(service.cvPreview({ ...PREVIEW, conceptId: "idempotent-retry" })).rejects.toMatchObject({
            code: "PROJECT_PREMIUM_REQUIRED",
        })
        await expect(service.cvPreview({ ...PREVIEW, milestoneId: "bf-http-foundation" })).rejects.toMatchObject({
            code: "PROJECT_PREMIUM_REQUIRED",
        })

        expect(em.query).not.toHaveBeenCalled()
        expect(essentials.preview).not.toHaveBeenCalled()
    })
})

describe("ProjectExtrasService codeRead", () => {
    it("answers every rubric criterion with its verdict, the excerpt hash and when it was graded, and never the expected evidence", async () => {
        const { service } = await build({ evidence: [readRow()] })

        const read = await service.codeRead(READ)

        expect(read).toMatchObject({
            projectId: PROJECT_ID,
            conceptId: "unit-testing-behavior",
            location: "internal/saga.go",
            excerptHash: HASH,
            gradedAt: "2026-11-08T09:00:00.000Z",
            question: "Where does it compensate?",
            passed: false,
            mean: 1,
        })
        expect(read?.criteria).toEqual([
            {
                criterionId: "c1",
                criterion: "Compensation on failure",
                level: 2,
                verdict: "met",
                evidenceQuote: "compensates on failure",
            },
            { criterionId: "c2", criterion: "Retry policy", level: 1, verdict: "partial", evidenceQuote: "retries" },
            { criterionId: "c3", criterion: "c3", level: 0, verdict: "missing", evidenceQuote: "" },
        ])
        expect(JSON.stringify(read)).not.toContain("SECRET")
    })

    it("takes the newest read, and answers a null hash for a read made before the hash was kept", async () => {
        const older = readRow({ run_id: "read-0", at: new Date("2026-11-07T09:00:00.000Z") })
        const newer = readRow({
            detail: { levels: [], question: "", facts: {} },
            at: new Date("2026-11-09T09:00:00.000Z"),
        })
        const { service } = await build({ evidence: [older, newer] })

        await expect(service.codeRead(READ)).resolves.toMatchObject({
            excerptHash: null,
            question: null,
            gradedAt: "2026-11-09T09:00:00.000Z",
            criteria: [],
        })
    })

    it("answers null before the first read, ignores a code-read row any other source wrote, and refuses a concept the project does not list", async () => {
        const forged = readRow({ source: "relay" })
        const { service } = await build({ evidence: [forged] })

        await expect(service.codeRead(READ)).resolves.toBeNull()
        await expect(service.codeRead({ ...READ, conceptId: "nope" })).rejects.toMatchObject({
            code: "PROJECT_CONCEPT_NOT_FOUND",
        })
        const absent = await build({ missing: true })
        await expect(absent.service.codeRead(READ)).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
    })
})

describe("ProjectExtrasService cvPreview", () => {
    it("drafts the line of a concept from the evidence only and lists the proof under it", async () => {
        const evidence = [
            evidenceDbRowOf({ concept_id: "idempotent-retry", slot: "test", source: "ci", run_id: "gh-9" }),
            evidenceDbRowOf({
                concept_id: "idempotent-retry",
                slot: "probe",
                source: "server-probe",
                run_id: "p-1",
                ref: "idempotency-replay",
            }),
            evidenceDbRowOf({ concept_id: "idempotent-retry", slot: "e2e", source: "relay", run_id: "r-1" }),
        ]
        const { service, essentials } = await build({ evidence })

        const view = await service.cvPreview({ ...PREVIEW, conceptId: "idempotent-retry" })

        expect(essentials.preview).toHaveBeenCalledWith({
            learnerId: PROJECT_LEARNER,
            lessonId: "idempotent-retry",
            project: expect.objectContaining({ projectId: PROJECT_ID }),
        })
        expect(view).toMatchObject({ subjectKind: "concept", subjectId: "idempotent-retry", proved: true })
        expect(view.text).toContain("Idempotency")
        expect(view.evidence.map((item) => [item.kind, item.ref, item.proofForm])).toEqual([
            ["ci-run", "gh-9", "signed-ci"],
            ["probe-run", "p-1", "server-probe"],
        ])
    })

    it("marks a concept that is only practised as not proved, and shows no text when its lesson is not written", async () => {
        const practised = [evidenceDbRowOf({ concept_id: "idempotent-retry", slot: "test", source: "relay" })]
        const { service } = await build({ evidence: practised })
        const noLesson = await build({ lessons: [] })

        await expect(service.cvPreview({ ...PREVIEW, conceptId: "idempotent-retry" })).resolves.toMatchObject({
            proved: false,
            evidence: [],
        })
        await expect(noLesson.service.cvPreview({ ...PREVIEW, conceptId: "idempotent-retry" })).resolves.toMatchObject({
            text: null,
        })
        expect(noLesson.essentials.preview).not.toHaveBeenCalled()
    })

    it("drafts the line of a milestone from its proof, with the CI run and the probe date", async () => {
        const evidence = [
            evidenceDbRowOf({ concept_id: "unit-testing-behavior", slot: "test", source: "ci", run_id: "gh-1" }),
            evidenceDbRowOf({
                concept_id: "unit-testing-behavior",
                slot: "code-read",
                source: "ai",
                run_id: "read-1",
                ref: "x.go",
            }),
        ]
        const { service } = await build({ evidence })

        const view = await service.cvPreview({ ...PREVIEW, milestoneId: "bf-http-foundation" })

        expect(view).toMatchObject({ subjectKind: "milestone", subjectId: "bf-http-foundation", proved: false })
        expect(view.evidence.map((item) => item.kind)).toEqual(["ci-run", "code-read"])
    })

    it("refuses neither or both of a concept and a milestone, and a milestone the project does not list", async () => {
        const { service } = await build()

        await expect(service.cvPreview(PREVIEW)).rejects.toMatchObject({ code: "PROJECT_INPUT_INVALID" })
        await expect(
            service.cvPreview({ ...PREVIEW, conceptId: "idempotent-retry", milestoneId: "bf-http-foundation" }),
        ).rejects.toMatchObject({ code: "PROJECT_INPUT_INVALID" })
        await expect(service.cvPreview({ ...PREVIEW, milestoneId: "agent-mindset" })).rejects.toMatchObject({
            code: "PROJECT_MILESTONE_NOT_FOUND",
        })
        await expect(service.cvPreview({ ...PREVIEW, conceptId: "nope" })).rejects.toMatchObject({
            code: "PROJECT_CONCEPT_NOT_FOUND",
        })
    })
})
