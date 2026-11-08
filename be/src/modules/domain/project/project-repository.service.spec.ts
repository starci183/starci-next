import { Test } from "@nestjs/testing"
import { builder, FakeClock, mockEntityManager } from "@starci/jest-preset"
import { PROJECT_ID, PROJECT_NOW } from "@tests/fixtures/builders/project.builder"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import type { ProjectOptions } from "./project.options"
import { PROJECT_OPTIONS } from "./project.decorators"
import { ProjectRepositoryService } from "./project-repository.service"
import type { RepositoryRow } from "./persistence/project.rows"
import { SELECT_OWN_PROJECT_REPOSITORY, SET_PROJECT_REPOSITORY } from "./persistence/project.sql"

const LEARNER_ID = "00000000-0000-4000-8000-0000000000aa"
const BOUND: RepositoryRow = { github_repository: "starci/shop", github_repository_id: "42" }

const build = async (rows: ReadonlyArray<RepositoryRow> = [BOUND], options: Partial<ProjectOptions> = {}) => {
    const em = mockEntityManager({
        query: [
            [SELECT_OWN_PROJECT_REPOSITORY, [...rows]],
            [SET_PROJECT_REPOSITORY, [...rows]],
        ],
    })
    const moduleRef = await Test.createTestingModule({
        providers: [
            ProjectRepositoryService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: CLOCK, useValue: new FakeClock(PROJECT_NOW) },
            { provide: PROJECT_OPTIONS, useValue: builder<ProjectOptions>({})(options) },
        ],
    }).compile()
    return { service: moduleRef.get(ProjectRepositoryService), em }
}

describe("ProjectRepositoryService view", () => {
    it("answers the binding of the learner's own project with the default audience", async () => {
        const { service, em } = await build()

        await expect(service.view(LEARNER_ID, PROJECT_ID)).resolves.toEqual({
            projectId: PROJECT_ID,
            repository: "starci/shop",
            repositoryId: "42",
            audience: "starci-next",
        })
        expect(em.query).toHaveBeenCalledWith(SELECT_OWN_PROJECT_REPOSITORY, [PROJECT_ID, LEARNER_ID])
    })

    it("answers the audience the app names and refuses another learner's project as not found", async () => {
        const named = await build([{ github_repository: null, github_repository_id: null }], {
            ciOidcAudience: "aud-x",
        })
        const absent = await build([])

        await expect(named.service.view(LEARNER_ID, PROJECT_ID)).resolves.toMatchObject({
            repository: null,
            audience: "aud-x",
        })
        await expect(absent.service.view(LEARNER_ID, PROJECT_ID)).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
    })
})

describe("ProjectRepositoryService set", () => {
    it("binds a pasted github.com address reduced to owner/name", async () => {
        const { service, em } = await build()

        await expect(
            service.set({
                learnerId: LEARNER_ID,
                projectId: PROJECT_ID,
                repository: "https://github.com/starci/shop.git",
            }),
        ).resolves.toMatchObject({ repository: "starci/shop" })
        expect(em.query).toHaveBeenCalledWith(SET_PROJECT_REPOSITORY, [
            PROJECT_ID,
            LEARNER_ID,
            "starci/shop",
            PROJECT_NOW,
        ])
    })

    it("refuses a malformed repository before it writes, and another learner's project as not found", async () => {
        const { service, em } = await build()
        const absent = await build([])

        await expect(
            service.set({ learnerId: LEARNER_ID, projectId: PROJECT_ID, repository: "nope" }),
        ).rejects.toMatchObject({
            code: "PROJECT_REPOSITORY_INVALID",
        })
        expect(em.query).not.toHaveBeenCalled()
        await expect(
            absent.service.set({ learnerId: LEARNER_ID, projectId: PROJECT_ID, repository: "starci/shop" }),
        ).rejects.toMatchObject({ code: "PROJECT_NOT_FOUND" })
    })
})
