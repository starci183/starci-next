import { Query } from "@nestjs/cqrs"
import type { ReviewDeckView } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { ListReviewDecksRequest } from "./list-review-decks.contracts"

/** The decks with whether the learner added each. */
export class ListReviewDecksQuery extends Query<ReadonlyArray<ReviewDeckView>> {
    constructor(readonly params: ExecuteParams<ListReviewDecksRequest>) {
        super()
    }
}
