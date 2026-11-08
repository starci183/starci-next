import { QueryHandler } from "@nestjs/cqrs"
import { ExperienceReadService, type ExperienceReviewItemView } from "@modules/domain/career"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetReviewItemQuery } from "./get-review-item.query"

@QueryHandler(GetReviewItemQuery)
/** Hands the message to the career capability, which authorizes and decides. */
export class GetReviewItemHandler extends ICQRSHandler<GetReviewItemQuery, ExperienceReviewItemView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: ExperienceReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetReviewItemQuery): Promise<ExperienceReviewItemView> {
        return this.reads.item(
            { subject: query.params.principal.id, roles: query.params.request.roles },
            query.params.request.itemId,
        )
    }
}
