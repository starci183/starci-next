import { Args, Query, Resolver } from "@nestjs/graphql"
import type { QueryBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectQueryBus } from "@modules/platform/cqrs"
import { GetPremiumOrderQuery } from "../../application/get-premium-order.query"
import { toGetPremiumOrderParams, toPremiumOrderType } from "./get-premium-order.mapper"
import { PremiumOrderInput } from "./dto/premium-order.input"
import { PremiumOrderType } from "./dto/premium-order.type"

@Resolver()
/** GraphQL door of premiumOrder: a signed-in learner reads one of their own orders. */
export class GetPremiumOrderResolver {
    constructor(@InjectQueryBus() private readonly queryBus: QueryBus) {}

    /** Reads the caller own order; another learner order is not found. */
    @Query(() => PremiumOrderType, { name: "premiumOrder" })
    async premiumOrder(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: PremiumOrderInput,
    ): Promise<PremiumOrderType> {
        const result = await this.queryBus.execute(new GetPremiumOrderQuery(toGetPremiumOrderParams(identity, input)))
        return toPremiumOrderType(result)
    }
}
