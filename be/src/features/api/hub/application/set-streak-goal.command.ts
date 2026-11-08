import { Command } from "@nestjs/cqrs"
import type { StreakGoalView } from "@modules/domain/streak"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { SetStreakGoalRequest } from "./set-streak-goal.contracts"

/** Sets the weekly goal and the reminder of the signed-in learner. */
export class SetStreakGoalCommand extends Command<StreakGoalView> {
    constructor(readonly params: ExecuteParams<SetStreakGoalRequest>) {
        super()
    }
}
