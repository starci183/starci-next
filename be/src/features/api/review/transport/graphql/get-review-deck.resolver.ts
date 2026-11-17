import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetReviewDeckQuery } from "../../application/get-review-deck.query"
import { RecallDeckDetailInput } from "./dto/recall-deck-detail.input"
import { RecallDeckDetailType } from "./dto/recall-deck-detail.type"
import { toGetReviewDeckParams } from "./get-review-deck.mapper"

@Resolver()
/** GraphQL door reviewDeck; it needs a session. */
export class GetReviewDeckResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** One deck with three sample questions, the progress of the learner and the new cards a day the goal brings. */
    @Query(() => RecallDeckDetailType, { name: "reviewDeck" })
    reviewDeck(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RecallDeckDetailInput,
    ): Promise<RecallDeckDetailType> {
        return this.queryBus.execute(new GetReviewDeckQuery(toGetReviewDeckParams(identity, input)))
    }
}
