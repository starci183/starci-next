import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessBuildQuery } from "../../application/get-harness-build.query"
import { HarnessBuildInput } from "./dto/harness-build.input"
import { HarnessBuildType } from "./dto/harness-build.type"
import { toHarnessBuildType, toHarnessBuildParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: one build with its stages, steps and e2e states; it needs a session and no Premium. */
export class GetHarnessBuildResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads one build with its stages, steps and e2e states. */
    @Query(() => HarnessBuildType, { name: "harnessBuild" })
    async harnessBuild(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: HarnessBuildInput,
    ): Promise<HarnessBuildType> {
        const result = await this.queryBus.execute(new GetHarnessBuildQuery(toHarnessBuildParams(identity, input)))
        return toHarnessBuildType(result)
    }
}
