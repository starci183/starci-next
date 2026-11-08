import { Test } from "@nestjs/testing"
import { builder, FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import {
    conceptViewOf,
    PROJECT_ID,
    PROJECT_LEARNER,
    PROJECT_NOW,
    projectRowOf,
} from "@tests/fixtures/builders/project.builder"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import type { ConceptLessonRef } from "./project.contracts"
import { PROJECT_OPTIONS } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import { ProjectCodeReadService } from "./project-code-read.service"
import { PROJECT_COACH, type ProjectCoach } from "./project-coach.port"
import { ProjectEvidenceService } from "./project-evidence.service"
import { PROJECT_LESSONS, type ProjectLessonPort } from "./project-lesson.port"
import type { ExplainConceptParams } from "./project-params.contracts"
import { ProjectReadService } from "./project-read.service"
import { COUNT_CODE_READS, SELECT_PROJECT, UPSERT_CONCEPT } from "./persistence/project.sql"

const LESSON: ConceptLessonRef = { id: "cqrs-read-models", version: "v1", title: "CQRS", topicId: "data" }
const RUBRIC = [
    { id: "c1", criterion: "Splits reads from writes", expectedEvidence: "a read model", misconception: "one model" },
    { id: "c2", criterion: "Keeps them in sync", expectedEvidence: "an update path", misconception: "none" },
]
const VIEW = conceptViewOf()

const PARAMS: ExplainConceptParams = {
    learnerId: PROJECT_LEARNER,
    projectId: PROJECT_ID,
    conceptId: "cqrs-read-models",
    location: "internal/orders/read_model.go#Project",
    excerpt: "func Project(event Event) { readModel.Apply(event) }",
    explanation: "Writes go through the command side. The read model is rebuilt from the events.",
    locale: "en",
}

interface World {
    readonly premium?: boolean
    readonly missing?: boolean
    readonly lesson?: boolean
    readonly rubric?: typeof RUBRIC
    readonly reads?: number
}

const build = async (world: World = {}, options: ProjectOptions = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_PROJECT, world.missing === true ? [] : [projectRowOf()]],
            [COUNT_CODE_READS, [{ total: world.reads ?? 0 }]],
            [UPSERT_CONCEPT, []],
        ],
    })
    const tx = fakeTransaction(em)
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(world.premium ?? true)
    const lessons = mock<ProjectLessonPort>()
    lessons.lessons.mockResolvedValue(new Map(world.lesson === false ? [] : [[LESSON.id, LESSON]]))
    lessons.rubricOf.mockResolvedValue({ criteria: world.rubric ?? RUBRIC })
    const coach = mock<ProjectCoach>()
    coach.read.mockResolvedValue({
        criteria: [
            { criterionId: "c1", level: 2, evidenceQuote: "read model" },
            { criterionId: "c2", level: 2, evidenceQuote: "rebuilt" },
        ],
        question: "Where is the model rebuilt?",
    })
    const evidence = mock<ProjectEvidenceService>()
    const reads = mock<ProjectReadService>()
    reads.concept.mockResolvedValue(VIEW)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectCodeReadService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: PROJECT_OPTIONS, useValue: builder<ProjectOptions>({})(options) },
            { provide: PROJECT_LESSONS, useValue: lessons },
            { provide: PROJECT_COACH, useValue: coach },
            { provide: ProjectEvidenceService, useValue: evidence },
            { provide: ProjectReadService, useValue: reads },
        ],
    }).compile()
    return { service: moduleRef.get(ProjectCodeReadService), em, tx, coach, evidence, reads, lessons }
}

describe("ProjectCodeReadService read", () => {
    it("has the teacher grade the explanation with the lesson rubric, stores a pass as AI evidence and settles", async () => {
        const { service, coach, evidence, em, tx } = await build()

        await expect(service.read(PARAMS)).resolves.toBe(VIEW)

        expect(coach.read).toHaveBeenCalledWith({
            requestId: `read-${PROJECT_NOW.getTime()}`,
            locale: "en",
            concept: "CQRS and read models",
            rubric: RUBRIC,
            location: PARAMS.location,
            excerpt: PARAMS.excerpt,
            explanation: PARAMS.explanation,
            timeoutMs: 60_000,
        })
        expect(evidence.append.mock.calls[0]?.[2][0]).toMatchObject({
            conceptId: "cqrs-read-models",
            slot: "code-read",
            source: "ai",
            passed: true,
            ref: PARAMS.location,
            runId: `read-${PROJECT_NOW.getTime()}`,
            detail: { reason: "read-passed", facts: { mean: 2 }, question: "Where is the model rebuilt?" },
        })
        expect(em.query).toHaveBeenCalledWith(UPSERT_CONCEPT, [
            PROJECT_ID,
            "cqrs-read-models",
            PARAMS.location,
            null,
            null,
            PROJECT_NOW,
        ])
        expect(evidence.settle).toHaveBeenCalledWith(expect.objectContaining({ project_id: PROJECT_ID }), [])
        expect(tx.commits).toBe(1)
    })

    it("keeps a read below the bar as a failing result", async () => {
        const { service, coach, evidence } = await build()
        coach.read.mockResolvedValue({
            criteria: [
                { criterionId: "c1", level: 1, evidenceQuote: "x" },
                { criterionId: "c2", level: 0, evidenceQuote: "" },
            ],
            question: "",
        })

        await service.read(PARAMS)

        expect(evidence.append.mock.calls[0]?.[2][0]).toMatchObject({
            passed: false,
            detail: { reason: "read-below-bar", facts: { mean: 0.5 } },
        })
    })
})

describe("ProjectCodeReadService read (part 2)", () => {
    it("refuses a project that is not the learner's and a concept the project does not list", async () => {
        const absent = await build({ missing: true })
        const other = await build()

        await expect(absent.service.read(PARAMS)).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
        await expect(other.service.read({ ...PARAMS, conceptId: "agent-harness-control-loop" })).rejects.toMatchObject({
            code: "PROJECT_CONCEPT_NOT_FOUND",
        })
        await expect(other.service.read({ ...PARAMS, conceptId: "nope" })).rejects.toMatchObject({
            code: "PROJECT_CONCEPT_NOT_FOUND",
        })
    })

    it("needs Premium", async () => {
        const { service, coach } = await build({ premium: false })

        await expect(service.read(PARAMS)).rejects.toMatchObject({ code: "PROJECT_PREMIUM_REQUIRED" })
        expect(coach.read).not.toHaveBeenCalled()
    })

    it("refuses a bad pointer, explanation or excerpt, and a secret before any provider call", async () => {
        const { service, coach } = await build()

        await expect(service.read({ ...PARAMS, location: "../x" })).rejects.toMatchObject({
            code: "PROJECT_LOCATION_INVALID",
        })
        await expect(service.read({ ...PARAMS, explanation: "One." })).rejects.toMatchObject({
            code: "PROJECT_EXPLANATION_INVALID",
        })
        await expect(service.read({ ...PARAMS, excerpt: "  " })).rejects.toMatchObject({
            code: "PROJECT_INPUT_INVALID",
        })
        await expect(
            service.read({ ...PARAMS, excerpt: `key = "${"a".repeat(12)}" token: 'abcdefgh1234'` }),
        ).rejects.toMatchObject({
            code: "PROJECT_EXCERPT_SECRET",
        })
        expect(coach.read).not.toHaveBeenCalled()
    })

    it("is not ready while the lesson or its rubric is being written", async () => {
        const noLesson = await build({ lesson: false })
        const noRubric = await build({ rubric: [] })

        await expect(noLesson.service.read(PARAMS)).rejects.toMatchObject({ code: "PROJECT_CONCEPT_NOT_READY" })
        await expect(noRubric.service.read(PARAMS)).rejects.toMatchObject({ code: "PROJECT_CONCEPT_NOT_READY" })
        expect(noLesson.lessons.rubricOf).not.toHaveBeenCalled()
    })

    it("stops at the daily cap, which the settings can raise, and counts a missing row as no read", async () => {
        const capped = await build({ reads: 20 })
        const raised = await build({ reads: 20 }, { codeReadsPerDay: 21 })
        const empty = await build()
        empty.em.query.mockImplementation((sql: unknown) => {
            if (sql === SELECT_PROJECT) return Promise.resolve([projectRowOf()])
            return Promise.resolve([])
        })

        await expect(capped.service.read(PARAMS)).rejects.toMatchObject({ code: "PROJECT_CODE_READ_LIMIT" })
        expect(capped.coach.read).not.toHaveBeenCalled()
        await expect(raised.service.read(PARAMS)).resolves.toBe(VIEW)
        await expect(empty.service.read(PARAMS)).resolves.toBe(VIEW)
    })
})
