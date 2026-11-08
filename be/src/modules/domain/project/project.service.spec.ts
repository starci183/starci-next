import { Test } from "@nestjs/testing"
import { builder, FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import {
    conceptViewOf,
    PROJECT_ID,
    summaryViewOf,
    PROJECT_LEARNER,
    PROJECT_NOW,
    projectRowOf,
} from "@tests/fixtures/builders/project.builder"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { PROBE_TRANSPORT, type ProbeTransport } from "@modules/integrations/probe"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { PROJECT_OPTIONS } from "./project.decorators"
import type { ProjectOptions } from "./project.options"
import { ProjectReadService } from "./project-read.service"
import { ProjectService } from "./project.service"
import type { CreateProjectParams } from "./project-params.contracts"
import {
    COUNT_PROJECTS,
    DELETE_PROJECT,
    INSERT_PROJECT,
    LOCK_LEARNER,
    ROTATE_SECRET,
    SELECT_PROJECT,
    UPDATE_PROJECT,
    UPSERT_CONCEPT,
} from "./persistence/project.sql"

const SUMMARY = summaryViewOf()
const CONCEPT = conceptViewOf()

const build = async (
    options: {
        premium?: boolean
        owned?: number
        found?: boolean
        changed?: boolean
        publicHost?: boolean
        deployedUrl?: string
    } = {},
    settings: ProjectOptions = {},
) => {
    const row =
        options.found === false
            ? []
            : [projectRowOf(options.deployedUrl === undefined ? {} : { deployed_url: options.deployedUrl })]
    const em = mockEntityManager({
        query: [
            [LOCK_LEARNER, []],
            [COUNT_PROJECTS, [{ total: options.owned ?? 0 }]],
            [INSERT_PROJECT, [{ project_id: PROJECT_ID }]],
            [SELECT_PROJECT, row],
            [UPDATE_PROJECT, []],
            [UPSERT_CONCEPT, []],
            [DELETE_PROJECT, options.changed === false ? [] : [{ project_id: PROJECT_ID }]],
            [ROTATE_SECRET, options.changed === false ? [] : [{ project_id: PROJECT_ID }]],
        ],
    })
    const tx = fakeTransaction(em)
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(options.premium ?? false)
    const reads = mock<ProjectReadService>()
    reads.summary.mockResolvedValue(SUMMARY)
    reads.concept.mockResolvedValue(CONCEPT)
    const probe = mock<ProbeTransport>()
    probe.isPublicHost.mockResolvedValue(options.publicHost ?? true)
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: PROJECT_OPTIONS, useValue: builder<ProjectOptions>({})(settings) },
            { provide: ProjectReadService, useValue: reads },
            { provide: PROBE_TRANSPORT, useValue: probe },
        ],
    }).compile()
    return { service: moduleRef.get(ProjectService), em, tx, reads, entitlement, probe }
}

const CREATE: CreateProjectParams = {
    learnerId: PROJECT_LEARNER,
    name: " Clinic booking ",
    kind: "app",
    topic: "Booking",
    language: "go",
    stack: "Go, PostgreSQL",
    track: null,
    repoUrl: "https://github.com/learner/clinic",
    locale: "en",
}

describe("ProjectService create", () => {
    it("creates the first project and answers it with a CI secret shown once", async () => {
        const { service, em, tx, reads } = await build()

        const created = await service.create(CREATE)

        expect(created.project).toBe(SUMMARY)
        expect(created.ciSecret).toMatch(/^[0-9a-f]{64}$/u)
        expect(em.query).toHaveBeenCalledWith(INSERT_PROJECT, [
            PROJECT_LEARNER,
            "Clinic booking",
            "app",
            "Booking",
            "go",
            "Go, PostgreSQL",
            null,
            "https://github.com/learner/clinic",
            created.ciSecret,
            PROJECT_NOW,
        ])
        expect(reads.summary).toHaveBeenCalledWith({ learnerId: PROJECT_LEARNER, projectId: PROJECT_ID, locale: "en" })
        expect(tx.commits).toBe(1)
    })
})

describe("ProjectService create (part 2)", () => {
    it("keeps a track for an agent", async () => {
        const { service, em } = await build()

        const created = await service.create({ ...CREATE, kind: "agent", track: "claude", repoUrl: null })

        expect(em.query).toHaveBeenCalledWith(INSERT_PROJECT, [
            PROJECT_LEARNER,
            "Clinic booking",
            "agent",
            "Booking",
            "go",
            "Go, PostgreSQL",
            "claude",
            null,
            created.ciSecret,
            PROJECT_NOW,
        ])
    })

    it("needs Premium for a project past the free ones, and lets Premium and a raised limit through", async () => {
        const free = await build({ owned: 1 })
        const premium = await build({ owned: 5, premium: true })
        const raised = await build({ owned: 1 }, { freeProjects: 2 })

        await expect(free.service.create(CREATE)).rejects.toMatchObject({ code: "PROJECT_PREMIUM_REQUIRED" })
        expect(free.tx.rollbacks).toBe(1)
        await expect(premium.service.create(CREATE)).resolves.toBeDefined()
        await expect(raised.service.create(CREATE)).resolves.toBeDefined()
    })
})

describe("ProjectService create (part 2)", () => {
    it("counts no row as no project", async () => {
        const { service, em } = await build()
        em.query.mockImplementation((sql: unknown) => {
            if (sql === COUNT_PROJECTS) return Promise.resolve([])
            return Promise.resolve([{ project_id: PROJECT_ID }])
        })

        await expect(service.create(CREATE)).resolves.toBeDefined()
    })

    it("refuses invalid fields before it writes", async () => {
        const { service, em } = await build()

        await expect(service.create({ ...CREATE, name: " " })).rejects.toMatchObject({ code: "PROJECT_INPUT_INVALID" })
        await expect(service.create({ ...CREATE, track: "claude" })).rejects.toMatchObject({
            code: "PROJECT_INPUT_INVALID",
        })
        await expect(service.create({ ...CREATE, repoUrl: "http://x.test" })).rejects.toMatchObject({
            code: "PROJECT_INPUT_INVALID",
        })
        expect(em.query).not.toHaveBeenCalled()
    })
})

describe("ProjectService update", () => {
    const UPDATE = {
        learnerId: PROJECT_LEARNER,
        projectId: PROJECT_ID,
        name: null,
        topic: null,
        language: null,
        stack: null,
        repoUrl: null,
        deployedUrl: null,
        locale: "en",
    } as const

    it("keeps every field that is left out", async () => {
        const { service, em, reads } = await build()

        await expect(service.update(UPDATE)).resolves.toBe(SUMMARY)

        expect(em.query).toHaveBeenCalledWith(UPDATE_PROJECT, [
            PROJECT_ID,
            PROJECT_LEARNER,
            "Clinic booking",
            "Booking",
            "go",
            "Go, PostgreSQL",
            "https://github.com/hocvien/dat-lich",
            "https://dat-lich.example.com",
            PROJECT_NOW,
        ])
        expect(reads.summary).toHaveBeenCalledWith(UPDATE)
    })

    it("changes every field named, checking the deployed address is public", async () => {
        const { service, em } = await build()

        await service.update({
            ...UPDATE,
            name: "New",
            topic: "T",
            language: "rust",
            stack: "Rust",
            repoUrl: "https://github.com/a/b",
            deployedUrl: "https://app.example.org/api/",
        })

        expect(em.query).toHaveBeenCalledWith(UPDATE_PROJECT, [
            PROJECT_ID,
            PROJECT_LEARNER,
            "New",
            "T",
            "rust",
            "Rust",
            "https://github.com/a/b",
            "https://app.example.org/api",
            PROJECT_NOW,
        ])
    })

    it("clears the repository and the deployed address with an empty text, and refuses an internal address", async () => {
        const { service, em } = await build()

        await service.update({ ...UPDATE, repoUrl: "", deployedUrl: " " })
        await expect(service.update({ ...UPDATE, deployedUrl: "http://169.254.169.254" })).rejects.toMatchObject({
            code: "PROJECT_TARGET_REFUSED",
        })

        expect(em.query).toHaveBeenCalledWith(UPDATE_PROJECT, expect.arrayContaining([null, null]))
    })
})

describe("ProjectService update (deployed address)", () => {
    const UPDATE = {
        learnerId: PROJECT_LEARNER,
        projectId: PROJECT_ID,
        name: null,
        topic: null,
        language: null,
        stack: null,
        repoUrl: null,
        deployedUrl: null,
        locale: "en",
    } as const

    it("refuses a deployed address whose host name resolves to a non-public address, and does not resolve an address it already holds", async () => {
        const refused = await build({ publicHost: false })
        const same = await build({ deployedUrl: "https://app.example.org" })

        await expect(
            refused.service.update({ ...UPDATE, deployedUrl: "https://127.0.0.1.nip.io" }),
        ).rejects.toMatchObject({ code: "PROJECT_TARGET_REFUSED" })
        await same.service.update({ ...UPDATE, deployedUrl: "https://app.example.org" })

        expect(refused.probe.isPublicHost).toHaveBeenCalledWith("127.0.0.1.nip.io")
        expect(same.probe.isPublicHost).not.toHaveBeenCalled()
    })

    it("does not find a project that is not the learner's", async () => {
        const { service } = await build({ found: false })

        await expect(service.update(UPDATE)).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
    })
})

describe("ProjectService remove and rotateSecret", () => {
    it("deletes a project and answers its id, or does not find it", async () => {
        const present = await build()
        const absent = await build({ changed: false })

        await expect(present.service.remove(PROJECT_LEARNER, PROJECT_ID)).resolves.toEqual({ id: PROJECT_ID })
        await expect(absent.service.remove(PROJECT_LEARNER, PROJECT_ID)).rejects.toMatchObject({
            code: "PROJECT_NOT_FOUND",
        })
    })

    it("replaces the secret and answers the new one once, or does not find the project", async () => {
        const present = await build()
        const absent = await build({ changed: false })
        const lookup = { learnerId: PROJECT_LEARNER, projectId: PROJECT_ID, locale: "en" } as const

        const rotated = await present.service.rotateSecret(lookup)

        expect(rotated.ciSecret).toMatch(/^[0-9a-f]{64}$/u)
        expect(rotated.project).toBe(SUMMARY)
        expect(present.em.query).toHaveBeenCalledWith(ROTATE_SECRET, [
            PROJECT_ID,
            PROJECT_LEARNER,
            rotated.ciSecret,
            PROJECT_NOW,
        ])
        await expect(absent.service.rotateSecret(lookup)).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
    })
})

describe("ProjectService setConcept", () => {
    const SET = {
        learnerId: PROJECT_LEARNER,
        projectId: PROJECT_ID,
        conceptId: "idempotency",
        location: "internal/booking/repo.go#Reserve",
        endpoint: "POST /bookings",
        sampleBody: '{"slot":"09:00"}',
        locale: "en",
    } as const

    it("points the concept at code and an endpoint and answers the concept", async () => {
        const { service, em, reads } = await build()

        await expect(service.setConcept(SET)).resolves.toBe(CONCEPT)

        expect(em.query).toHaveBeenCalledWith(UPSERT_CONCEPT, [
            PROJECT_ID,
            "idempotency",
            "internal/booking/repo.go#Reserve",
            "POST /bookings",
            '{"slot":"09:00"}',
            PROJECT_NOW,
        ])
        expect(reads.concept).toHaveBeenCalledWith(SET)
    })

    it("leaves a field that is not named", async () => {
        const { service, em } = await build()

        await service.setConcept({ ...SET, location: null, endpoint: null, sampleBody: null })

        expect(em.query).toHaveBeenCalledWith(UPSERT_CONCEPT, [
            PROJECT_ID,
            "idempotency",
            null,
            null,
            null,
            PROJECT_NOW,
        ])
    })

    it("refuses a concept the project does not list, a bad pointer and a project that is not the learner's", async () => {
        const { service } = await build()
        const absent = await build({ found: false })

        await expect(service.setConcept({ ...SET, conceptId: "agent-harness-control-loop" })).rejects.toMatchObject({
            code: "PROJECT_CONCEPT_NOT_FOUND",
        })
        await expect(service.setConcept({ ...SET, location: "../x" })).rejects.toMatchObject({
            code: "PROJECT_LOCATION_INVALID",
        })
        await expect(service.setConcept({ ...SET, endpoint: "x" })).rejects.toMatchObject({
            code: "PROJECT_ENDPOINT_INVALID",
        })
        await expect(service.setConcept({ ...SET, sampleBody: "{" })).rejects.toMatchObject({
            code: "PROJECT_ENDPOINT_INVALID",
        })
        await expect(absent.service.setConcept(SET)).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
    })
})
