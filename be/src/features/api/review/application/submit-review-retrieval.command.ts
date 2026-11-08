import { Command } from "@nestjs/cqrs"
import type { ReviewFlipView } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SubmitReviewRetrievalRequest } from "./submit-review-retrieval.contracts"

/** Stores the written answer to a retrieval item, then shows the sample answer. */
export class SubmitReviewRetrievalCommand extends Command<ReviewFlipView> {
    constructor(readonly params: ExecuteParams<SubmitReviewRetrievalRequest>) {
        super()
    }
}
