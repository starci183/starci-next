import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { AddReviewDeckCommand } from "../../application/add-review-deck.command"
import { RecallDeckInput } from "./dto/recall-deck.input"
import { RecallDeckAddedType } from "./dto/recall-deck-added.type"
import { toAddReviewDeckParams } from "./add-review-deck.mapper"

@Resolver()
/** GraphQL door addReviewDeck; it needs a session. */
export class AddReviewDeckResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Gives the learner the cards of a deck, due today. */
    @Mutation(() => RecallDeckAddedType, { name: "addReviewDeck" })
    addReviewDeck(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RecallDeckInput,
    ): Promise<RecallDeckAddedType> {
        return this.commandBus.execute(new AddReviewDeckCommand(toAddReviewDeckParams(identity, input)))
    }
}
