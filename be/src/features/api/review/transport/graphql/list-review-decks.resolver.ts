import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { ListReviewDecksQuery } from "../../application/list-review-decks.query"
import { RecallDecksInput } from "./dto/recall-decks.input"
import { RecallDeckType } from "./dto/recall-deck.type"
import { toListReviewDecksParams } from "./list-review-decks.mapper"

@Resolver()
/** GraphQL door reviewDecks; it needs a session. */
export class ListReviewDecksResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** The decks with whether the learner added each. */
    @Query(() => [RecallDeckType], { name: "reviewDecks" })
    reviewDecks(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RecallDecksInput,
    ): Promise<ReadonlyArray<RecallDeckType>> {
        return this.queryBus.execute(new ListReviewDecksQuery(toListReviewDecksParams(identity, input)))
    }
}
