import { CommandHandler } from "@nestjs/cqrs"
import { InterviewSessionService, type SessionView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { StartInterviewCommand } from "./start-interview.command"

@CommandHandler(StartInterviewCommand)
/** Starts a session: the quota is checked, the questions are drawn and the first prompt is stored. It makes no AI call. */
export class StartInterviewHandler extends ICQRSHandler<StartInterviewCommand, SessionView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly sessions: InterviewSessionService,
    ) {
        super(logger)
    }

    protected override process(command: StartInterviewCommand): Promise<SessionView> {
        return this.sessions.start({ learnerId: command.params.principal.id, ...command.params.request })
    }
}
