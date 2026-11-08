import { mockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LessonLinkService } from "./lesson-link.service"
import { SELECT_MODULE_LESSONS } from "./persistence/lesson.sql"

const build = async (rows: ReadonlyArray<object>) => {
    const em = mockEntityManager({ query: [[SELECT_MODULE_LESSONS, rows]] })
    const moduleRef = await Test.createTestingModule({
        providers: [LessonLinkService, { provide: PRIMARY_ENTITY_MANAGER, useValue: em }],
    }).compile()
    return { service: moduleRef.get(LessonLinkService), em }
}

describe("LessonLinkService ofModules", () => {
    it("groups the live lessons by the module slug they came from, titled in the locale", async () => {
        const { service, em } = await build([
            { module_ref: "0-core", lesson_id: "a", topic: "t1", title: "A" },
            { module_ref: "0-core", lesson_id: "b", topic: "t1", title: "B" },
            { module_ref: "1-data", lesson_id: "c", topic: "t2", title: "C" },
        ])

        await expect(service.ofModules(["0-core", "1-data", "2-none"], "vi")).resolves.toEqual({
            "0-core": [
                { lessonId: "a", topic: "t1", title: "A" },
                { lessonId: "b", topic: "t1", title: "B" },
            ],
            "1-data": [{ lessonId: "c", topic: "t2", title: "C" }],
        })
        expect(em.query).toHaveBeenCalledWith(SELECT_MODULE_LESSONS, [["0-core", "1-data", "2-none"], "vi", 500])
    })

    it("asks the database nothing when no module is named", async () => {
        const { service, em } = await build([])

        await expect(service.ofModules([], "en")).resolves.toEqual({})
        expect(em.query).not.toHaveBeenCalled()
    })
})
