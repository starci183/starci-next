import { CommandRunner, Option, SubCommand } from "nest-commander"
import { InterviewCalibrationService } from "@modules/domain/interview"

/** The options of `cli interview publish`. */
export interface PublishInterviewOptions {
    /** The bank id to publish; empty for every validated bank. */
    readonly bank: string
    /** Publish without the calibration pre-check. */
    readonly skipPrecheck: boolean
}

@SubCommand({
    name: "publish",
    description: "Publish validated interview banks after the grader scores the authored sample answers",
})
/**
 * `cli interview publish [--bank <bankId>] [--skip-precheck]`: runs the calibration pre-check of each validated bank (the grader
 * must keep the order and the scores of the five authored sample answers) and publishes the banks that pass. `--skip-precheck`
 * publishes without it and records that; it is for a dev stack that has no AI key.
 */
export class PublishInterviewCli extends CommandRunner {
    constructor(private readonly calibration: InterviewCalibrationService) {
        super()
    }

    /** `--bank <bankId>`: one bank. */
    @Option({ flags: "--bank <bankId>", description: "One bank id (default: every validated bank)", defaultValue: "" })
    parseBank(value: string): string {
        return value
    }

    /** `--skip-precheck`: publish without calibration. */
    @Option({ flags: "--skip-precheck", description: "Publish without the calibration pre-check (dev only)" })
    parseSkip(): boolean {
        return true
    }

    /** Publishes the banks. */
    async run(_passed: Array<string>, options: PublishInterviewOptions): Promise<void> {
        await this.calibration.publishValidated(options.bank, options.skipPrecheck)
    }
}
