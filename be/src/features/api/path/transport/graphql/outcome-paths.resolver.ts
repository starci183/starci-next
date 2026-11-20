import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetOutcomePathsQuery } from "../../application/get-outcome-paths.query"
import { OutcomePathsInput } from "./dto/outcome-paths.input"
import { OutcomePathsType } from "./dto/outcome-paths.type"
import { toOutcomePathsParams, toOutcomePathsType } from "./outcome-paths.mapper"

@Resolver()
/** GraphQL door of the goal layer: the five outcome paths and the one the learner follows; a guest may read the five paths and follows none; no Premium. */
export class OutcomePathsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the paths in the asked locale; opening them counts for nothing in the streak. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => OutcomePathsType, { name: "outcomePaths" })
    async outcomePaths(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: OutcomePathsInput,
    ): Promise<OutcomePathsType> {
        const result = await this.queryBus.execute(new GetOutcomePathsQuery(toOutcomePathsParams(identity, input)))
        return toOutcomePathsType(result)
    }
}
