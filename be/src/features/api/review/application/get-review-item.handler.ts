import { QueryHandler } from "@nestjs/cqrs"
import { ReviewItemService, type ReviewItemView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetReviewItemQuery } from "./get-review-item.query"

@QueryHandler(GetReviewItemQuery)
/** The question of one item; never the answer or a cloze term. */
export class GetReviewItemHandler extends ICQRSHandler<GetReviewItemQuery, ReviewItemView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly items: ReviewItemService,
    ) {
        super(logger)
    }

    protected override process(message: GetReviewItemQuery): Promise<ReviewItemView> {
        return this.items.item(
            message.params.principal.id,
            message.params.request.itemId,
            message.params.request.locale,
        )
    }
}
