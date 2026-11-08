import { QueryHandler } from "@nestjs/cqrs"
import { ReviewDeckService, type ReviewDeckView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ListReviewDecksQuery } from "./list-review-decks.query"

@QueryHandler(ListReviewDecksQuery)
/** The decks with whether the learner added each. */
export class ListReviewDecksHandler extends ICQRSHandler<ListReviewDecksQuery, ReadonlyArray<ReviewDeckView>> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly decks: ReviewDeckService,
    ) {
        super(logger)
    }

    protected override process(message: ListReviewDecksQuery): Promise<ReadonlyArray<ReviewDeckView>> {
        return this.decks.decks(message.params.principal.id, message.params.request)
    }
}
