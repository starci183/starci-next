import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { SetReviewGoalCommand } from "../../application/set-review-goal.command"
import { SetRecallGoalInput } from "./dto/set-recall-goal.input"
import { RecallGoalSetType } from "./dto/recall-goal-set.type"
import { toSetReviewGoalParams } from "./set-review-goal.mapper"

@Resolver()
/** GraphQL door setReviewGoal; it needs a session. */
export class SetReviewGoalResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Sets the daily item goal, 5 to 50. */
    @Mutation(() => RecallGoalSetType, { name: "setReviewGoal" })
    setReviewGoal(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: SetRecallGoalInput,
    ): Promise<RecallGoalSetType> {
        return this.commandBus.execute(new SetReviewGoalCommand(toSetReviewGoalParams(identity, input)))
    }
}
