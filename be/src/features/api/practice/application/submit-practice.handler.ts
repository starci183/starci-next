import { CommandHandler } from "@nestjs/cqrs"
import { PracticeSubmissionService, type PracticeSubmissionView } from "@modules/domain/practice"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SubmitPracticeCommand } from "./submit-practice.command"

@CommandHandler(SubmitPracticeCommand)
/** Hands a submit of the solution against every test to the practice capability. */
export class SubmitPracticeHandler extends ICQRSHandler<SubmitPracticeCommand, PracticeSubmissionView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly submissions: PracticeSubmissionService,
    ) {
        super(logger)
    }

    protected override process(command: SubmitPracticeCommand): Promise<PracticeSubmissionView> {
        return this.submissions.submit({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
