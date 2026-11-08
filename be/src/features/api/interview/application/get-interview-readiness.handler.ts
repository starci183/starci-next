import { QueryHandler } from "@nestjs/cqrs"
import { InterviewHistoryService, type ReadinessView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetInterviewReadinessQuery } from "./get-interview-readiness.query"

@QueryHandler(GetInterviewReadinessQuery)
/** Reads the hiring readiness at a track and tier: ready when both pillars passed. */
export class GetInterviewReadinessHandler extends ICQRSHandler<GetInterviewReadinessQuery, ReadinessView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly history: InterviewHistoryService,
    ) {
        super(logger)
    }

    protected override process(command: GetInterviewReadinessQuery): Promise<ReadinessView> {
        return this.history.readiness(
            command.params.principal.id,
            command.params.request.track,
            command.params.request.tier,
        )
    }
}
