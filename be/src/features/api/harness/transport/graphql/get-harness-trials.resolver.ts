import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetHarnessTrialsQuery } from "../../application/get-harness-trials.query"
import { HarnessTrialsInput } from "./dto/harness-trials.input"
import { HarnessTrapType } from "./dto/harness-trap.type"
import { toHarnessTrapTypes, toHarnessTrialsParams } from "./harness.mapper"

@Resolver()
/** GraphQL door of /harness: the trial traps with the newest result of each; it needs a session and no Premium. */
export class GetHarnessTrialsResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the trial traps with the newest result of each. */
    @Query(() => [HarnessTrapType], { name: "harnessTrials" })
    async harnessTrials(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: HarnessTrialsInput,
    ): Promise<Array<HarnessTrapType>> {
        const result = await this.queryBus.execute(new GetHarnessTrialsQuery(toHarnessTrialsParams(identity, input)))
        return toHarnessTrapTypes(result)
    }
}
