import { Query } from "@nestjs/cqrs"
import type { ReviewDeckDetailView } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewDeckRequest } from "./get-review-deck.contracts"

/** One deck with three sample questions, the progress of the learner and the new cards a day the goal brings. */
export class GetReviewDeckQuery extends Query<ReviewDeckDetailView> {
    constructor(readonly params: ExecuteParams<GetReviewDeckRequest>) {
        super()
    }
}
