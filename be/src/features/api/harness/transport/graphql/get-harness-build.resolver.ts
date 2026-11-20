import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessBuildQuery } from "../../application/get-harness-build.query"
import { HarnessBuildInput } from "./dto/harness-build.input"
import { HarnessBuildType } from "./dto/harness-build.type"
import { toHarnessBuildType, toHarnessBuildParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: one build with its stages, steps and e2e states; a guest may read it (no progress), no Premium. */
export class GetHarnessBuildResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads one build with its stages, steps and e2e states. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => HarnessBuildType, { name: "harnessBuild" })
    async harnessBuild(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: HarnessBuildInput,
    ): Promise<HarnessBuildType> {
        const result = await this.queryBus.execute(new GetHarnessBuildQuery(toHarnessBuildParams(identity, input)))
        return toHarnessBuildType(result)
    }
}
