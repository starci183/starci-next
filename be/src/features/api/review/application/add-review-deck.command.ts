import { Command } from "@nestjs/cqrs"
import type { ReviewDeckAddedView } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { AddReviewDeckRequest } from "./add-review-deck.contracts"

/** Gives the learner the cards of a deck, due today. */
export class AddReviewDeckCommand extends Command<ReviewDeckAddedView> {
    constructor(readonly params: ExecuteParams<AddReviewDeckRequest>) {
        super()
    }
}
