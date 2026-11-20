import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessGuideQuery } from "../../application/get-harness-guide.query"
import { HarnessGuideInput } from "./dto/harness-guide.input"
import { HarnessGuideType } from "./dto/harness-guide.type"
import { toHarnessGuideType, toHarnessGuideParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: one guide with its sections and probe results; a guest may read it (no progress), no Premium. */
export class GetHarnessGuideResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads one guide with its sections and probe results. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => HarnessGuideType, { name: "harnessGuide" })
    async harnessGuide(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: HarnessGuideInput,
    ): Promise<HarnessGuideType> {
        const result = await this.queryBus.execute(new GetHarnessGuideQuery(toHarnessGuideParams(identity, input)))
        return toHarnessGuideType(result)
    }
}
