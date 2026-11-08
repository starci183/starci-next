import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetReviewItemQuery } from "../../application/get-review-item.query"
import { RecallItemInput } from "./dto/recall-item.input"
import { RecallItemType } from "./dto/recall-item.type"
import { toGetReviewItemParams } from "./get-review-item.mapper"

@Resolver()
/** GraphQL door recallItem (named apart from the experience reviewItem); it needs a session. */
export class GetReviewItemResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** The question of one item; never the answer or a cloze term. */
    @Query(() => RecallItemType, { name: "recallItem" })
    recallItem(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: RecallItemInput,
    ): Promise<RecallItemType> {
        return this.queryBus.execute(new GetReviewItemQuery(toGetReviewItemParams(identity, input)))
    }
}
