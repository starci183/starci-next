import { QueryHandler } from "@nestjs/cqrs"
import { InterviewHistoryService, type HistoryView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetInterviewHistoryQuery } from "./get-interview-history.query"

@QueryHandler(GetInterviewHistoryQuery)
/** Reads the sessions of the learner and the score trend per track and tier. */
export class GetInterviewHistoryHandler extends ICQRSHandler<GetInterviewHistoryQuery, HistoryView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly history: InterviewHistoryService,
    ) {
        super(logger)
    }

    protected override process(command: GetInterviewHistoryQuery): Promise<HistoryView> {
        return this.history.history(command.params.principal.id, command.params.request.track)
    }
}
