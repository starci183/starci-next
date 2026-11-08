import { Query } from "@nestjs/cqrs"
import type { ReviewTodayView } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewTodayRequest } from "./get-review-today.contracts"

/** The queue of the day: due items, new items up to the goal and locked items. */
export class GetReviewTodayQuery extends Query<ReviewTodayView> {
    constructor(readonly params: ExecuteParams<GetReviewTodayRequest>) {
        super()
    }
}
