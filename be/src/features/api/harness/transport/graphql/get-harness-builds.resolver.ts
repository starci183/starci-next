import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessBuildsQuery } from "../../application/get-harness-builds.query"
import { HarnessLocaleInput } from "./dto/harness-locale.input"
import { HarnessBuildSummaryType } from "./dto/harness-build-summary.type"
import { toHarnessBuildSummaryTypes, toLocaleParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: the builds with the progress of each; a guest may read it (no progress), no Premium. */
export class GetHarnessBuildsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the builds with the progress of each. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => [HarnessBuildSummaryType], { name: "harnessBuilds" })
    async harnessBuilds(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: HarnessLocaleInput,
    ): Promise<Array<HarnessBuildSummaryType>> {
        const result = await this.queryBus.execute(new GetHarnessBuildsQuery(toLocaleParams(identity, input)))
        return toHarnessBuildSummaryTypes(result)
    }
}
