import { Command } from "@nestjs/cqrs"
import type { ReviewClozeResult } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { CheckReviewClozeRequest } from "./check-review-cloze.contracts"

/** Checks a picked choice against the hidden term; answers correct or not. */
export class CheckReviewClozeCommand extends Command<ReviewClozeResult> {
    constructor(readonly params: ExecuteParams<CheckReviewClozeRequest>) {
        super()
    }
}
