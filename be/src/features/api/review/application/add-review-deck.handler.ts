import { CommandHandler } from "@nestjs/cqrs"
import { ReviewDeckService, type ReviewDeckAddedView } from "@modules/domain/review"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { AddReviewDeckCommand } from "./add-review-deck.command"

@CommandHandler(AddReviewDeckCommand)
/** Gives the learner the cards of a deck, due today. */
export class AddReviewDeckHandler extends ICQRSHandler<AddReviewDeckCommand, ReviewDeckAddedView> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly decks: ReviewDeckService,
    ) {
        super(logger)
    }

    protected override process(message: AddReviewDeckCommand): Promise<ReviewDeckAddedView> {
        return this.decks.add(message.params.principal.id, message.params.request.deckId)
    }
}
