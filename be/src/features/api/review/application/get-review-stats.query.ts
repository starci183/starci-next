import { Query } from "@nestjs/cqrs"
import type { ReviewStatsView } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewStatsRequest } from "./get-review-stats.contracts"

/** The active days a week and the recall rate of the first reviews. */
export class GetReviewStatsQuery extends Query<ReviewStatsView> {
    constructor(readonly params: ExecuteParams<GetReviewStatsRequest>) {
        super()
    }
}
