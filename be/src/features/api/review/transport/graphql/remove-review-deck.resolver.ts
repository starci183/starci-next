import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { RemoveReviewDeckCommand } from "../../application/remove-review-deck.command"
import { RecallDeckInput } from "./dto/recall-deck.input"
import { RecallDeckRemovedType } from "./dto/recall-deck-removed.type"
import { toRemoveReviewDeckParams } from "./remove-review-deck.mapper"

@Resolver()
/** GraphQL door removeReviewDeck; it needs a session. */
export class RemoveReviewDeckResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Suspends the items of a deck and keeps their history. */
    @Mutation(() => RecallDeckRemovedType, { name: "removeReviewDeck" })
    removeReviewDeck(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RecallDeckInput,
    ): Promise<RecallDeckRemovedType> {
        return this.commandBus.execute(new RemoveReviewDeckCommand(toRemoveReviewDeckParams(identity, input)))
    }
}
