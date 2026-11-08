import { CommandHandler } from "@nestjs/cqrs"
import { InterviewGradingService, type GradingView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RegradeInterviewCommand } from "./regrade-interview.command"

@CommandHandler(RegradeInterviewCommand)
/** Grades a session again after a failed grading; the transcript is kept and the learner is not asked again. */
export class RegradeInterviewHandler extends ICQRSHandler<RegradeInterviewCommand, GradingView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly grading: InterviewGradingService,
    ) {
        super(logger)
    }

    protected override process(command: RegradeInterviewCommand): Promise<GradingView> {
        return this.grading.regrade(command.params.principal.id, command.params.request.sessionId)
    }
}
