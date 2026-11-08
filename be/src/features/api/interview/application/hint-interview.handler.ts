import { CommandHandler } from "@nestjs/cqrs"
import { InterviewTurnService, type HintView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { HintInterviewCommand } from "./hint-interview.command"

@CommandHandler(HintInterviewCommand)
/** Gives the next authored hint of the open question; each hint used takes a little off that question. */
export class HintInterviewHandler extends ICQRSHandler<HintInterviewCommand, HintView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly turns: InterviewTurnService,
    ) {
        super(logger)
    }

    protected override process(command: HintInterviewCommand): Promise<HintView> {
        return this.turns.hint(
            command.params.principal.id,
            command.params.request.sessionId,
            command.params.request.position,
        )
    }
}
