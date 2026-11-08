import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ReviewImportService } from "@modules/domain/review"
import { ImportReviewDecksCli } from "./import.cli"

const build = async () => {
    const decks = mock<ReviewImportService>()
    const moduleRef = await Test.createTestingModule({
        providers: [ImportReviewDecksCli, { provide: ReviewImportService, useValue: decks }],
    }).compile()
    return { command: moduleRef.get(ImportReviewDecksCli), decks }
}

describe("ImportReviewDecksCli", () => {
    it("delegates the directory, the ref and the deck list to the deck import once", async () => {
        const { command, decks } = await build()

        await command.run([], { dir: "data", ref: "origin-main", only: "0-fullstack-mastery/0-module-1" })

        expect(decks.import).toHaveBeenCalledWith({
            directory: "data",
            ref: "origin-main",
            only: "0-fullstack-mastery/0-module-1",
        })
        expect(decks.import).toHaveBeenCalledTimes(1)
    })

    it("takes --dir, --ref and --only as given", async () => {
        const { command } = await build()

        expect(command.parseDir("data")).toBe("data")
        expect(command.parseRef("origin-main")).toBe("origin-main")
        expect(command.parseOnly("a,b")).toBe("a,b")
    })
})
