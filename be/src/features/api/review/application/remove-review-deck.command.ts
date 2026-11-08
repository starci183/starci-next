import { Command } from "@nestjs/cqrs"
import type { ReviewDeckRemovedView } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { RemoveReviewDeckRequest } from "./remove-review-deck.contracts"

/** Suspends the items of a deck and keeps their history. */
export class RemoveReviewDeckCommand extends Command<ReviewDeckRemovedView> {
    constructor(readonly params: ExecuteParams<RemoveReviewDeckRequest>) {
        super()
    }
}
