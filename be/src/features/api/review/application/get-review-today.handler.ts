import { QueryHandler } from "@nestjs/cqrs"
import { ReviewQueueService, type ReviewTodayView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetReviewTodayQuery } from "./get-review-today.query"

@QueryHandler(GetReviewTodayQuery)
/** The queue of the day: due items, new items up to the goal and locked items. */
export class GetReviewTodayHandler extends ICQRSHandler<GetReviewTodayQuery, ReviewTodayView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly queue: ReviewQueueService,
    ) {
        super(logger)
    }

    protected override process(message: GetReviewTodayQuery): Promise<ReviewTodayView> {
        return this.queue.today(message.params.principal.id, message.params.request.locale)
    }
}
