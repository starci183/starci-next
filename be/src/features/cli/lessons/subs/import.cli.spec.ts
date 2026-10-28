import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { LESSON_CONTENT_SERVICE, LessonContentService } from "@modules/domain/lesson-content"
import { ImportLessonsCli } from "./import.cli"

const build = async () => {
    const lessons = mock<LessonContentService>()
    const moduleRef = await Test.createTestingModule({
        providers: [ImportLessonsCli, { provide: LESSON_CONTENT_SERVICE, useValue: lessons }],
    }).compile()
    return { command: moduleRef.get(ImportLessonsCli), lessons }
}

describe("ImportLessonsCli", () => {
    it("delegates the import of the named fixture directory to the capability once", async () => {
        const { command, lessons } = await build()

        await command.run([], { fixture: "fixtures/snapshot" })

        expect(lessons.importLessons).toHaveBeenCalledWith({ fixtureDir: "fixtures/snapshot" })
        expect(lessons.importLessons).toHaveBeenCalledTimes(1)
    })

    it("leaves fixture selection to the capability when none is named, and takes --fixture as given", async () => {
        const { command, lessons } = await build()

        await command.run([])

        expect(lessons.importLessons).toHaveBeenCalledWith({ fixtureDir: undefined })
        expect(command.parseFixture("fixtures/snapshot")).toBe("fixtures/snapshot")
    })
})
