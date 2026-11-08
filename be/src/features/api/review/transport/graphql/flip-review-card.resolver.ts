import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { FlipReviewCardCommand } from "../../application/flip-review-card.command"
import { FlipRecallCardInput } from "./dto/flip-recall-card.input"
import { RecallFlipType } from "./dto/recall-flip.type"
import { toFlipReviewCardParams } from "./flip-review-card.mapper"

@Resolver()
/** GraphQL door flipReviewCard; it needs a session. */
export class FlipReviewCardResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Reveals the answer of a card and the days each grade would give. */
    @Mutation(() => RecallFlipType, { name: "flipReviewCard" })
    flipReviewCard(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: FlipRecallCardInput,
    ): Promise<RecallFlipType> {
        return this.commandBus.execute(new FlipReviewCardCommand(toFlipReviewCardParams(identity, input)))
    }
}
