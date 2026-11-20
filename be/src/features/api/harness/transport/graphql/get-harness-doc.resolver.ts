import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessDocQuery } from "../../application/get-harness-doc.query"
import { HarnessDocInput } from "./dto/harness-doc.input"
import { HarnessDocType } from "./dto/harness-doc.type"
import { toHarnessDocType, toHarnessDocParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: one doc with its sections; a guest may read it (no progress), no Premium. */
export class GetHarnessDocResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads one doc with its sections. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => HarnessDocType, { name: "harnessDoc" })
    async harnessDoc(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: HarnessDocInput,
    ): Promise<HarnessDocType> {
        const result = await this.queryBus.execute(new GetHarnessDocQuery(toHarnessDocParams(identity, input)))
        return toHarnessDocType(result)
    }
}
