import { QueryHandler } from "@nestjs/cqrs"
import { ReviewDeckService, type ReviewDeckDetailView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetReviewDeckQuery } from "./get-review-deck.query"

@QueryHandler(GetReviewDeckQuery)
/** Hands the read of one deck to the review capability. */
export class GetReviewDeckHandler extends ICQRSHandler<GetReviewDeckQuery, ReviewDeckDetailView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly decks: ReviewDeckService,
    ) {
        super(logger)
    }

    protected override process(message: GetReviewDeckQuery): Promise<ReviewDeckDetailView> {
        return this.decks.deck(message.params.principal.id, {
            deckId: message.params.request.deckId,
            locale: message.params.request.locale,
        })
    }
}
