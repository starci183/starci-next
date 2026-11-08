import { CommandHandler } from "@nestjs/cqrs"
import { InterviewGradingService, type GradingView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { SubmitInterviewCommand } from "./submit-interview.command"

@CommandHandler(SubmitInterviewCommand)
/** Ends the interview and grades the whole session once; it answers when the grading is done or has failed. */
export class SubmitInterviewHandler extends ICQRSHandler<SubmitInterviewCommand, GradingView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly grading: InterviewGradingService,
    ) {
        super(logger)
    }

    protected override process(command: SubmitInterviewCommand): Promise<GradingView> {
        return this.grading.submit(command.params.principal.id, command.params.request.sessionId)
    }
}
