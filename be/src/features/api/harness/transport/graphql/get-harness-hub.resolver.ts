import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { MaybePrincipal, Public, PublicReason, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessHubQuery } from "../../application/get-harness-hub.query"
import { HarnessLocaleInput } from "./dto/harness-locale.input"
import { HarnessHubType } from "./dto/harness-hub.type"
import { toHarnessHubType, toLocaleParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: the hub of /harness: its three parts with the learner counts; a guest may read it (no progress), no Premium. */
export class GetHarnessHubResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the hub of /harness: its three parts with the learner counts. */
    @Public({ reason: PublicReason.GuestRead })
    @Query(() => HarnessHubType, { name: "harnessHub" })
    async harnessHub(
        @MaybePrincipal() identity: IdentityPrincipal | undefined,
        @Args("input") input: HarnessLocaleInput,
    ): Promise<HarnessHubType> {
        const result = await this.queryBus.execute(new GetHarnessHubQuery(toLocaleParams(identity, input)))
        return toHarnessHubType(result)
    }
}
