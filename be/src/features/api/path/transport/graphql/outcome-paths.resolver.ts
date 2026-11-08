import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetOutcomePathsQuery } from "../../application/get-outcome-paths.query"
import { OutcomePathsInput } from "./dto/outcome-paths.input"
import { OutcomePathsType } from "./dto/outcome-paths.type"
import { toOutcomePathsParams, toOutcomePathsType } from "./outcome-paths.mapper"

@Resolver()
/** GraphQL door of the goal layer: the five outcome paths and the one the learner follows; it needs a session and no Premium. */
export class OutcomePathsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the paths in the asked locale; opening them counts for nothing in the streak. */
    @Query(() => OutcomePathsType, { name: "outcomePaths" })
    async outcomePaths(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: OutcomePathsInput,
    ): Promise<OutcomePathsType> {
        const result = await this.queryBus.execute(new GetOutcomePathsQuery(toOutcomePathsParams(identity, input)))
        return toOutcomePathsType(result)
    }
}
