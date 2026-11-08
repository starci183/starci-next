import { CommandHandler } from "@nestjs/cqrs"
import { ReviewDeckService, type ReviewDeckRemovedView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { RemoveReviewDeckCommand } from "./remove-review-deck.command"

@CommandHandler(RemoveReviewDeckCommand)
/** Suspends the items of a deck and keeps their history. */
export class RemoveReviewDeckHandler extends ICQRSHandler<RemoveReviewDeckCommand, ReviewDeckRemovedView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly decks: ReviewDeckService,
    ) {
        super(logger)
    }

    protected override process(message: RemoveReviewDeckCommand): Promise<ReviewDeckRemovedView> {
        return this.decks.remove(message.params.principal.id, message.params.request.deckId)
    }
}
