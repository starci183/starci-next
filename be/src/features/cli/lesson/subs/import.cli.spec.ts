import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { LessonImportService } from "@modules/domain/lesson"
import { ImportLessonsCli } from "./import.cli"

const build = async () => {
    const lessons = mock<LessonImportService>()
    const moduleRef = await Test.createTestingModule({
        providers: [ImportLessonsCli, { provide: LessonImportService, useValue: lessons }],
    }).compile()
    return { command: moduleRef.get(ImportLessonsCli), lessons }
}

describe("ImportLessonsCli", () => {
    it("delegates the directory, the ref and the folder list to the lesson import once", async () => {
        const { command, lessons } = await build()

        await command.run([], {
            dir: "concepts",
            ref: "231d8cc57",
            only: "2-cqrs-read-models,4-health-probe-semantics",
        })

        expect(lessons.import).toHaveBeenCalledWith({
            directory: "concepts",
            ref: "231d8cc57",
            only: "2-cqrs-read-models,4-health-probe-semantics",
        })
        expect(lessons.import).toHaveBeenCalledTimes(1)
    })

    it("takes --dir, --ref and --only as given", async () => {
        const { command } = await build()

        expect(command.parseDir("concepts")).toBe("concepts")
        expect(command.parseRef("231d8cc57")).toBe("231d8cc57")
        expect(command.parseOnly("a,b")).toBe("a,b")
    })
})
