import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessGuidesQuery } from "../../application/get-harness-guides.query"
import { HarnessGuidesInput } from "./dto/harness-guides.input"
import { HarnessGuideSummaryType } from "./dto/harness-guide-summary.type"
import { toHarnessGuideSummaryTypes, toHarnessGuidesParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: the guides of one tool; it needs a session and no Premium. */
export class GetHarnessGuidesResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the guides of one tool. */
    @Query(() => [HarnessGuideSummaryType], { name: "harnessGuides" })
    async harnessGuides(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: HarnessGuidesInput,
    ): Promise<Array<HarnessGuideSummaryType>> {
        const result = await this.queryBus.execute(new GetHarnessGuidesQuery(toHarnessGuidesParams(identity, input)))
        return toHarnessGuideSummaryTypes(result)
    }
}
