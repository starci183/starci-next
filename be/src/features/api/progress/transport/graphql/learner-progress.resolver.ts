import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetLearnerProgressQuery } from "../../application/get-learner-progress.query"
import { LearnerProgressInput } from "./dto/learner-progress.input"
import { LearnerProgressType } from "./dto/learner-progress.type"
import { toLearnerProgressParams, toLearnerProgressType } from "./learner-progress.mapper"

@Resolver()
/** GraphQL door of the progress page: one read across Essentials, the harness, Projects and Review; it needs a session and no Premium. */
export class LearnerProgressResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the progress of the learner who asks; opening it counts for nothing in the streak. */
    @Query(() => LearnerProgressType, { name: "learnerProgress" })
    async learnerProgress(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: LearnerProgressInput,
    ): Promise<LearnerProgressType> {
        const result = await this.queryBus.execute(
            new GetLearnerProgressQuery(toLearnerProgressParams(identity, input)),
        )
        return toLearnerProgressType(result)
    }
}
