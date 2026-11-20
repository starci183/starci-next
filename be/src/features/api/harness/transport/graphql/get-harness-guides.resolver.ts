import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessGuidesQuery } from "../../application/get-harness-guides.query"
import { HarnessGuidesInput } from "./dto/harness-guides.input"
import { HarnessGuideSummaryType } from "./dto/harness-guide-summary.type"
import { toHarnessGuideSummaryTypes, toHarnessGuidesParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: the guides of one tool; a guest may read it (no progress), no Premium. */
export class GetHarnessGuidesResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the guides of one tool. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => [HarnessGuideSummaryType], { name: "harnessGuides" })
    async harnessGuides(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: HarnessGuidesInput,
    ): Promise<Array<HarnessGuideSummaryType>> {
        const result = await this.queryBus.execute(new GetHarnessGuidesQuery(toHarnessGuidesParams(identity, input)))
        return toHarnessGuideSummaryTypes(result)
    }
}
