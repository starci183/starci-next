import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { PracticeImportService } from "@modules/domain/practice"
import { ImportPracticeCli } from "./import.cli"

const build = async () => {
    const practice = mock<PracticeImportService>()
    const moduleRef = await Test.createTestingModule({
        providers: [ImportPracticeCli, { provide: PracticeImportService, useValue: practice }],
    }).compile()
    return { command: moduleRef.get(ImportPracticeCli), practice }
}

describe("ImportPracticeCli", () => {
    it("delegates the directory, the ref and the pattern list to the practice import once", async () => {
        const { command, practice } = await build()

        await command.run([], { dir: "coding-problems", ref: "231d8cc57", only: "arrays,graph" })

        expect(practice.import).toHaveBeenCalledWith({
            directory: "coding-problems",
            ref: "231d8cc57",
            only: "arrays,graph",
        })
        expect(practice.import).toHaveBeenCalledTimes(1)
    })

    it("takes --dir, --ref and --only as given", async () => {
        const { command } = await build()

        expect(command.parseDir("coding-problems")).toBe("coding-problems")
        expect(command.parseRef("231d8cc57")).toBe("231d8cc57")
        expect(command.parseOnly("a,b")).toBe("a,b")
    })
})
