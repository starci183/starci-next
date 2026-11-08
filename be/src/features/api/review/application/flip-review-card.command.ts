import { Command } from "@nestjs/cqrs"
import type { ReviewFlipView } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { FlipReviewCardRequest } from "./flip-review-card.contracts"

/** Reveals the answer of a card and the days each grade would give. */
export class FlipReviewCardCommand extends Command<ReviewFlipView> {
    constructor(readonly params: ExecuteParams<FlipReviewCardRequest>) {
        super()
    }
}
