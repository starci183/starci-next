import { QueryHandler } from "@nestjs/cqrs"
import { ExperienceReadService, type ReviewQueueView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetReviewQueueQuery } from "./get-review-queue.query"

@QueryHandler(GetReviewQueueQuery)
/** Hands the message to the career capability, which authorizes and decides. */
export class GetReviewQueueHandler extends ICQRSHandler<GetReviewQueueQuery, ReviewQueueView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: ExperienceReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetReviewQueueQuery): Promise<ReviewQueueView> {
        return this.reads.queue(
            { subject: query.params.principal.id, roles: query.params.request.roles },
            query.params.request.tab,
        )
    }
}
