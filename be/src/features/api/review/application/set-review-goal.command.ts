import { Command } from "@nestjs/cqrs"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetReviewGoalRequest } from "./set-review-goal.contracts"

/** Sets the daily item goal, 5 to 50. */
export class SetReviewGoalCommand extends Command<{ readonly daily: number }> {
    constructor(readonly params: ExecuteParams<SetReviewGoalRequest>) {
        super()
    }
}
