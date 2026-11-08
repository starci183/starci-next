import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetReviewTodayQuery } from "../../application/get-review-today.query"
import { RecallTodayInput } from "./dto/recall-today.input"
import { RecallTodayType } from "./dto/recall-today.type"
import { toGetReviewTodayParams } from "./get-review-today.mapper"

@Resolver()
/** GraphQL door reviewToday; it needs a session. */
export class GetReviewTodayResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** The queue of the day: due items, new items up to the goal and locked items. */
    @Query(() => RecallTodayType, { name: "reviewToday" })
    reviewToday(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RecallTodayInput,
    ): Promise<RecallTodayType> {
        return this.queryBus.execute(new GetReviewTodayQuery(toGetReviewTodayParams(identity, input)))
    }
}
