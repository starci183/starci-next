import { Command } from "@nestjs/cqrs"
import type { ReviewGradeView } from "@modules/domain/review"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GradeReviewCardRequest } from "./grade-review-card.contracts"

/** Stores the self-grade of a revealed item and schedules its next review. */
export class GradeReviewCardCommand extends Command<ReviewGradeView> {
    constructor(readonly params: ExecuteParams<GradeReviewCardRequest>) {
        super()
    }
}
