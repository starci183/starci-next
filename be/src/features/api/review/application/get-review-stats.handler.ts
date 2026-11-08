import { QueryHandler } from "@nestjs/cqrs"
import { ReviewDeckService, type ReviewStatsView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetReviewStatsQuery } from "./get-review-stats.query"

@QueryHandler(GetReviewStatsQuery)
/** The active days a week and the recall rate of the first reviews. */
export class GetReviewStatsHandler extends ICQRSHandler<GetReviewStatsQuery, ReviewStatsView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly decks: ReviewDeckService,
    ) {
        super(logger)
    }

    protected override process(message: GetReviewStatsQuery): Promise<ReviewStatsView> {
        return this.decks.stats(message.params.principal.id, message.params.request)
    }
}
