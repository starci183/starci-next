import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetReviewQueueQuery } from "../../application/get-review-queue.query"
import { ReviewQueueInput } from "./dto/review-queue.input"
import { ReviewQueueType } from "./dto/review-queue.type"
import { toGetReviewQueueParams, toGetReviewQueueType } from "./get-review-queue.mapper"

@Resolver()
/** GraphQL door of the review queue (Experience review); it needs a session with role TEACHER or REVIEWER. */
export class GetReviewQueueResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the pending items of the signer, oldest due first, with the count of each tab. */
    @Query(() => ReviewQueueType, { name: "reviewQueue" })
    async reviewQueue(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: ReviewQueueInput,
    ): Promise<ReviewQueueType> {
        const result = await this.queryBus.execute(new GetReviewQueueQuery(toGetReviewQueueParams(identity, input)))
        return toGetReviewQueueType(result)
    }
}
