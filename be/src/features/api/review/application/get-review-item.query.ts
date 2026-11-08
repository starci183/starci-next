import { Query } from "@nestjs/cqrs"
import type { ReviewItemView } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewItemRequest } from "./get-review-item.contracts"

/** The question of one item; never the answer or a cloze term. */
export class GetReviewItemQuery extends Query<ReviewItemView> {
    constructor(readonly params: ExecuteParams<GetReviewItemRequest>) {
        super()
    }
}
