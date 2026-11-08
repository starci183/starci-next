import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SetStreakGoalCommand } from "../../application/set-streak-goal.command"
import { SetStreakGoalInput } from "./dto/set-streak-goal.input"
import { StreakGoalType } from "./dto/streak-goal.type"
import { toSetStreakGoalParams, toStreakGoalType } from "./streak.mapper"

@Resolver()
/** GraphQL door that sets the weekly goal (2 to 7 active days) and the reminder of the learner; it needs a session. */
export class SetStreakGoalResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Stores the goal; a goal outside 2 to 7 is STREAK_GOAL_INVALID. */
    @Mutation(() => StreakGoalType, { name: "setStreakGoal" })
    async setStreakGoal(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SetStreakGoalInput,
    ): Promise<StreakGoalType> {
        const result = await this.commandBus.execute(new SetStreakGoalCommand(toSetStreakGoalParams(identity, input)))
        return toStreakGoalType(result)
    }
}
