import { QueryHandler } from "@nestjs/cqrs"
import { InterviewCatalogService, type InterviewOptionsView } from "@modules/domain/interview"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetInterviewOptionsQuery } from "./get-interview-options.query"

@QueryHandler(GetInterviewOptionsQuery)
/** Reads the tracks, the live banks, the access of the learner and the session in progress. */
export class GetInterviewOptionsHandler extends ICQRSHandler<GetInterviewOptionsQuery, InterviewOptionsView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly catalog: InterviewCatalogService,
    ) {
        super(logger)
    }

    protected override process(command: GetInterviewOptionsQuery): Promise<InterviewOptionsView> {
        return this.catalog.options(
            command.params.principal.id,
            command.params.request.locale,
            command.params.request.track,
        )
    }
}
