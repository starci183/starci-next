import { QueryHandler } from "@nestjs/cqrs"
import { HubService, type LearnerHubView } from "@modules/domain/hub"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetLearnerHubQuery } from "./get-learner-hub.query"

@QueryHandler(GetLearnerHubQuery)
/** Builds the hub of the learner who asks. */
export class GetLearnerHubHandler extends ICQRSHandler<GetLearnerHubQuery, LearnerHubView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly hub: HubService,
    ) {
        super(logger)
    }

    protected override process(query: GetLearnerHubQuery): Promise<LearnerHubView> {
        return this.hub.read(query.params.principal.id, query.params.request.locale)
    }
}
