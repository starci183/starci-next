import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessDocsQuery } from "../../application/get-harness-docs.query"
import { HarnessLocaleInput } from "./dto/harness-locale.input"
import { HarnessDocSummaryType } from "./dto/harness-doc-summary.type"
import { toHarnessDocSummaryTypes, toLocaleParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: the docs of the harness; a guest may read it (no progress), no Premium. */
export class GetHarnessDocsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the docs of the harness. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => [HarnessDocSummaryType], { name: "harnessDocs" })
    async harnessDocs(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: HarnessLocaleInput,
    ): Promise<Array<HarnessDocSummaryType>> {
        const result = await this.queryBus.execute(new GetHarnessDocsQuery(toLocaleParams(identity, input)))
        return toHarnessDocSummaryTypes(result)
    }
}
