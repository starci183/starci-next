import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { InterviewImportService } from "@modules/domain/interview"
import { ImportInterviewCli } from "./import.cli"

describe("ImportInterviewCli", () => {
    it("delegates the checkout, the ref and the bank list to the import once, and takes the flags as given", async () => {
        const interviews = mock<InterviewImportService>()
        const moduleRef = await Test.createTestingModule({
            providers: [ImportInterviewCli, { provide: InterviewImportService, useValue: interviews }],
        }).compile()
        const command = moduleRef.get(ImportInterviewCli)

        await command.run([], { dir: "data", ref: "231d8cc57", only: "eq/1-behavioral" })

        expect(interviews.import).toHaveBeenCalledWith({ directory: "data", ref: "231d8cc57", only: "eq/1-behavioral" })
        expect([
            command.parseDir("d"),
            command.parseRef("r"),
            command.parseOnly("a,b"),
            command.parseOverlay("o"),
        ]).toEqual(["d", "r", "a,b", "o"])
    })

    it("passes the overlay root on when it is given", async () => {
        const interviews = mock<InterviewImportService>()
        const moduleRef = await Test.createTestingModule({
            providers: [ImportInterviewCli, { provide: InterviewImportService, useValue: interviews }],
        }).compile()

        await moduleRef.get(ImportInterviewCli).run([], { dir: "data", ref: "r", only: "", overlay: "overlay" })

        expect(interviews.import).toHaveBeenCalledWith({ directory: "data", ref: "r", only: "", overlay: "overlay" })
    })
})
