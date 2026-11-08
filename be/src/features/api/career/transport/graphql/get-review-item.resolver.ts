import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetReviewItemQuery } from "../../application/get-review-item.query"
import { ReviewItemInput } from "./dto/review-item.input"
import { ReviewItemType } from "./dto/review-item.type"
import { toGetReviewItemParams, toGetReviewItemType } from "./get-review-item.mapper"

@Resolver()
/** GraphQL door of one item under review; it needs a session with role TEACHER or REVIEWER and a scope over the item. */
export class GetReviewItemResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the item with its line, grade, evidence and history. */
    @Query(() => ReviewItemType, { name: "reviewItem" })
    async reviewItem(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ReviewItemInput,
    ): Promise<ReviewItemType> {
        const result = await this.queryBus.execute(new GetReviewItemQuery(toGetReviewItemParams(identity, input)))
        return toGetReviewItemType(result)
    }
}
