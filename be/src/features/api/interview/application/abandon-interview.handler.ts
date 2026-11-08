import { CommandHandler } from "@nestjs/cqrs"
import { InterviewSessionService, type AbandonView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { AbandonInterviewCommand } from "./abandon-interview.command"

@CommandHandler(AbandonInterviewCommand)
/** Abandons the active session; an abandoned free session still counts for its month. */
export class AbandonInterviewHandler extends ICQRSHandler<AbandonInterviewCommand, AbandonView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly sessions: InterviewSessionService,
    ) {
        super(logger)
    }

    protected override process(command: AbandonInterviewCommand): Promise<AbandonView> {
        return this.sessions.abandon(command.params.principal.id, command.params.request.sessionId)
    }
}
