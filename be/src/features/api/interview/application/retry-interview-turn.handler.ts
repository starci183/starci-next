import { CommandHandler } from "@nestjs/cqrs"
import { InterviewTurnService, type AnswerView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RetryInterviewTurnCommand } from "./retry-interview-turn.command"

@CommandHandler(RetryInterviewTurnCommand)
/** Asks the interviewer again for the turn a failure skipped; the learner never answers twice. */
export class RetryInterviewTurnHandler extends ICQRSHandler<RetryInterviewTurnCommand, AnswerView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly turns: InterviewTurnService,
    ) {
        super(logger)
    }

    protected override process(command: RetryInterviewTurnCommand): Promise<AnswerView> {
        return this.turns.retry(command.params.principal.id, command.params.request.sessionId)
    }
}
