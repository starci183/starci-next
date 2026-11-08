import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { InterviewCalibrationService } from "@modules/domain/interview"
import { PublishInterviewCli } from "./publish.cli"

describe("PublishInterviewCli", () => {
    const build = async () => {
        const calibration = mock<InterviewCalibrationService>()
        const moduleRef = await Test.createTestingModule({
            providers: [PublishInterviewCli, { provide: InterviewCalibrationService, useValue: calibration }],
        }).compile()
        return { command: moduleRef.get(PublishInterviewCli), calibration }
    }

    it("publishes every validated bank with the pre-check when no flag is given", async () => {
        const { command, calibration } = await build()

        await expect(command.run([], { bank: "", skipPrecheck: false })).resolves.toBeUndefined()

        expect(calibration.publishValidated).toHaveBeenCalledWith("", false)
    })

    it("publishes the named bank, skipping the pre-check when asked", async () => {
        const { command, calibration } = await build()

        const options = { bank: command.parseBank("eq/1-behavioral"), skipPrecheck: command.parseSkip() }

        expect(options).toEqual({ bank: "eq/1-behavioral", skipPrecheck: true })
        await expect(command.run([], options)).resolves.toBeUndefined()
        expect(calibration.publishValidated).toHaveBeenCalledWith("eq/1-behavioral", true)
    })
})
