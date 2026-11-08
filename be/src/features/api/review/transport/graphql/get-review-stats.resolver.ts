import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetReviewStatsQuery } from "../../application/get-review-stats.query"
import { RecallStatsInput } from "./dto/recall-stats.input"
import { RecallStatsType } from "./dto/recall-stats.type"
import { toGetReviewStatsParams } from "./get-review-stats.mapper"

@Resolver()
/** GraphQL door reviewStats; it needs a session. */
export class GetReviewStatsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** The active days a week and the recall rate of the first reviews. */
    @Query(() => RecallStatsType, { name: "reviewStats" })
    reviewStats(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RecallStatsInput,
    ): Promise<RecallStatsType> {
        return this.queryBus.execute(new GetReviewStatsQuery(toGetReviewStatsParams(identity, input)))
    }
}
