import { QueryHandler } from "@nestjs/cqrs"
import { InterviewSessionService, type SessionView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetInterviewSessionQuery } from "./get-interview-session.query"

@QueryHandler(GetInterviewSessionQuery)
/** Reads a session; the scorecard, the ideal answers and the lessons appear only once it is graded. */
export class GetInterviewSessionHandler extends ICQRSHandler<GetInterviewSessionQuery, SessionView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly sessions: InterviewSessionService,
    ) {
        super(logger)
    }

    protected override process(command: GetInterviewSessionQuery): Promise<SessionView> {
        return this.sessions.read(command.params.principal.id, command.params.request.sessionId)
    }
}
