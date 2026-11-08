import { Test } from "@nestjs/testing"
import { builder, mock, mockEntityManager } from "@starci/jest-preset"
import {
    ciRunRowOf,
    conceptRowOf,
    evidenceDbRowOf,
    probeRunRowOf,
    PROJECT_ID,
    PROJECT_LEARNER,
    projectRowOf,
} from "@tests/fixtures/builders/project.builder"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import type { ConceptLessonRef } from "./project.contracts"
import { PROJECT_OPTIONS } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import type { ProjectLessonPort } from "./project-lesson.port"
import { PROJECT_LESSONS } from "./project-lesson.port"
import { ProjectReadService } from "./project-read.service"
import {
    SELECT_CONCEPTS,
    SELECT_EVIDENCE,
    SELECT_LAST_CI_RUNS,
    SELECT_LAST_PROBE_RUNS,
    SELECT_PROJECT,
    SELECT_PROJECTS,
    SELECT_PROVED_CONCEPTS,
} from "./persistence/project.sql"

const LESSONS = new Map<string, ConceptLessonRef>(
    ["idempotency", "request-response-lifecycle", "health-probe-semantics", "unit-testing-behavior"].map((id) => [
        id,
        { id, version: "v1", title: id, topicId: "topic" },
    ]),
)

interface World {
    readonly projects?: ReadonlyArray<ReturnType<typeof projectRowOf>>
    readonly evidence?: ReadonlyArray<ReturnType<typeof evidenceDbRowOf>>
    readonly premium?: boolean
}

const build = async (world: World = {}, options: ProjectOptions = {}) => {
    const projects = world.projects ?? [projectRowOf()]
    const em = mockEntityManager({
        query: [
            [SELECT_PROJECTS, projects],
            [SELECT_PROJECT, projects.slice(0, 1)],
            [SELECT_EVIDENCE, world.evidence ?? []],
            [SELECT_CONCEPTS, [conceptRowOf({ concept_id: "request-response-lifecycle" })]],
            [SELECT_LAST_CI_RUNS, [ciRunRowOf()]],
            [SELECT_LAST_PROBE_RUNS, [probeRunRowOf()]],
            [
                SELECT_PROVED_CONCEPTS,
                [{ project_id: PROJECT_ID, concept_id: "saga", proved_at: new Date("2026-11-05T00:00:00.000Z") }],
            ],
        ],
    })
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(world.premium ?? false)
    const lessons = mock<ProjectLessonPort>()
    lessons.lessons.mockResolvedValue(LESSONS)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectReadService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: PROJECT_LESSONS, useValue: lessons },
            { provide: PROJECT_OPTIONS, useValue: builder<ProjectOptions>({})(options) },
        ],
    }).compile()
    return { service: moduleRef.get(ProjectReadService), em, entitlement, lessons }
}

const LOOKUP = { learnerId: PROJECT_LEARNER, projectId: PROJECT_ID, locale: "en" } as const

const proofRows = () => [
    evidenceDbRowOf({ concept_id: "request-response-lifecycle", slot: "test" }),
    evidenceDbRowOf({
        concept_id: "request-response-lifecycle",
        slot: "probe",
        source: "server-probe",
        ref: "invalid-input",
        run_id: "p1",
    }),
]

describe("ProjectReadService list", () => {
    it("answers nothing for a learner with no project, without reading evidence", async () => {
        const { service, em } = await build({ projects: [] })

        await expect(service.list({ learnerId: PROJECT_LEARNER, locale: "en" })).resolves.toEqual([])
        expect(em.query).toHaveBeenCalledTimes(1)
    })

    it("shows each project with the concepts proved in it", async () => {
        const { service } = await build({ evidence: proofRows() })

        const [project] = await service.list({ learnerId: PROJECT_LEARNER, locale: "en" })

        expect(project).toMatchObject({
            id: PROJECT_ID,
            provedConceptCount: 1,
            conceptCount: 4,
            currentMilestoneId: "bf-http-foundation",
        })
    })
})

describe("ProjectReadService get", () => {
    it("shows the milestones with their lock, the last CI run and the last probe run", async () => {
        const { service } = await build({ evidence: proofRows() })

        const project = await service.get(LOOKUP)

        expect(project.milestones[0]).toMatchObject({ id: "bf-http-foundation", locked: false, provedCount: 1 })
        expect(project.milestones[1]).toMatchObject({ id: "bf-data-and-cache", locked: true })
        expect(project).toMatchObject({
            lastCiRun: { runId: "run-1", commit: "abc1234" },
            lastProbeRun: { passed: true },
            practisingConceptCount: 0,
        })
    })

    it("unlocks every milestone for Premium", async () => {
        const { service } = await build({ premium: true })

        const project = await service.get(LOOKUP)

        expect(project.milestones.every((milestone) => !milestone.locked)).toBe(true)
    })

    it("shows no CI run and no probe run before the first", async () => {
        const { service, em } = await build()
        em.query.mockImplementation((sql: unknown) => {
            if (sql === SELECT_PROJECT) return Promise.resolve([projectRowOf()])
            return Promise.resolve([])
        })

        await expect(service.get(LOOKUP)).resolves.toMatchObject({ lastCiRun: null, lastProbeRun: null })
    })

    it("does not find a project that is not the learner's", async () => {
        const { service } = await build({ projects: [] })

        await expect(service.get(LOOKUP)).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
    })
})

describe("ProjectReadService milestone", () => {
    it("shows the concept checklist of a free milestone with its pointers and lessons", async () => {
        const { service } = await build({ evidence: proofRows() })

        const view = await service.milestone({ ...LOOKUP, milestoneId: "bf-http-foundation" })

        expect(view.milestone).toMatchObject({ id: "bf-http-foundation", provedCount: 1, locked: false })
        expect(view.concepts.map((concept) => concept.id)).toEqual([
            "request-response-lifecycle",
            "health-probe-semantics",
            "unit-testing-behavior",
        ])
        expect(view.concepts[0]).toMatchObject({
            state: "proved",
            endpoint: "POST /bookings",
            lesson: { id: "request-response-lifecycle" },
        })
        expect(view.concepts[1]).toMatchObject({ endpoint: null })
    })

    it("needs Premium past the free milestones, and knows only the milestones of the project's kind", async () => {
        const free = await build()
        const premium = await build({ premium: true })

        await expect(free.service.milestone({ ...LOOKUP, milestoneId: "bf-data-and-cache" })).rejects.toMatchObject({
            code: "PROJECT_PREMIUM_REQUIRED",
        })
        await expect(premium.service.milestone({ ...LOOKUP, milestoneId: "bf-data-and-cache" })).resolves.toMatchObject(
            {
                milestone: { locked: false },
            },
        )
        await expect(premium.service.milestone({ ...LOOKUP, milestoneId: "agent-mindset" })).rejects.toMatchObject({
            code: "PROJECT_MILESTONE_NOT_FOUND",
        })
    })
})

describe("ProjectReadService concept and summary", () => {
    it("shows one concept of a project, and refuses a concept it does not list", async () => {
        const { service } = await build()

        await expect(service.concept({ ...LOOKUP, conceptId: "idempotency" })).resolves.toMatchObject({
            id: "idempotency",
        })
        await expect(service.concept({ ...LOOKUP, conceptId: "agent-harness-control-loop" })).rejects.toMatchObject({
            code: "PROJECT_CONCEPT_NOT_FOUND",
        })
    })

    it("shows the project in short", async () => {
        const { service } = await build()

        await expect(service.summary(LOOKUP)).resolves.toMatchObject({ id: PROJECT_ID, name: "Clinic booking" })
    })
})

describe("ProjectReadService catalog", () => {
    it("lists the milestones with the free ones, the concepts still being written", async () => {
        const { service } = await build({}, { freeMilestones: ["launch"], freeProjects: 2 })

        const catalog = await service.catalog({ locale: "en" })

        expect(catalog.milestones.find((milestone) => milestone.id === "launch")?.free).toBe(true)
        expect(catalog.milestones.find((milestone) => milestone.id === "bf-http-foundation")?.free).toBe(false)
        expect(catalog.concepts.find((concept) => concept.id === "idempotency")).toMatchObject({ comingSoon: false })
        expect(catalog.concepts.find((concept) => concept.id === "saga")).toMatchObject({ comingSoon: true })
        expect(catalog.freeProjects).toBe(2)
    })
})

describe("ProjectReadService provedConcepts", () => {
    it("lists the concepts a learner proved with the first proof time", async () => {
        const { service } = await build()

        await expect(service.provedConcepts(PROJECT_LEARNER)).resolves.toEqual([
            { projectId: PROJECT_ID, conceptId: "saga", provedAt: "2026-11-05T00:00:00.000Z" },
        ])
    })
})
