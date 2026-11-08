import { Query } from "@nestjs/cqrs"
import type { ReviewQueueView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewQueueRequest } from "./get-review-queue.contracts"

/** Lists the review queue of a teacher or an appointed reviewer. */
export class GetReviewQueueQuery extends Query<ReviewQueueView> {
    constructor(readonly params: ExecuteParams<GetReviewQueueRequest>) {
        super()
    }
}
