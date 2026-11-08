import { CommandHandler } from "@nestjs/cqrs"
import { InterviewTurnService, type AnswerView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { AnswerInterviewCommand } from "./answer-interview.command"

@CommandHandler(AnswerInterviewCommand)
/** Stores the answer to the open question, then asks the interviewer what follows; it shows no score and no feedback. */
export class AnswerInterviewHandler extends ICQRSHandler<AnswerInterviewCommand, AnswerView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly turns: InterviewTurnService,
    ) {
        super(logger)
    }

    protected override process(command: AnswerInterviewCommand): Promise<AnswerView> {
        return this.turns.answer({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
