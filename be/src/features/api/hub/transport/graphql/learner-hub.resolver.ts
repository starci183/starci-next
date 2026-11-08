import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLearnerHubQuery } from "../../application/get-learner-hub.query"
import { LearnerHubInput } from "./dto/learner-hub.input"
import { LearnerHubType } from "./dto/learner-hub.type"
import { toLearnerHubParams, toLearnerHubType } from "./learner-hub.mapper"

@Resolver()
/** GraphQL door of the hub: the streak, what is left today and the six learning shards; it needs a session and no Premium. */
export class LearnerHubResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the hub of the learner who asks; opening it counts for nothing in the streak. */
    @Query(() => LearnerHubType, { name: "learnerHub" })
    async learnerHub(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LearnerHubInput,
    ): Promise<LearnerHubType> {
        const result = await this.queryBus.execute(new GetLearnerHubQuery(toLearnerHubParams(identity, input)))
        return toLearnerHubType(result)
    }
}
