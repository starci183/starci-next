import { Query } from "@nestjs/cqrs"
import type { ExperienceReviewItemView } from "@modules/domain/career"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetReviewItemRequest } from "./get-review-item.contracts"

/** Reads one item and its audit trail for a signer. */
export class GetReviewItemQuery extends Query<ExperienceReviewItemView> {
    constructor(readonly params: ExecuteParams<GetReviewItemRequest>) {
        super()
    }
}
