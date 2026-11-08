import { CommandHandler } from "@nestjs/cqrs"
import { PracticeSubmissionService, type PracticeSubmissionView } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RunPracticeCommand } from "./run-practice.command"

@CommandHandler(RunPracticeCommand)
/** Hands a run of the solution against the public example to the practice capability. */
export class RunPracticeHandler extends ICQRSHandler<RunPracticeCommand, PracticeSubmissionView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly submissions: PracticeSubmissionService,
    ) {
        super(logger)
    }

    protected override process(command: RunPracticeCommand): Promise<PracticeSubmissionView> {
        return this.submissions.run({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
