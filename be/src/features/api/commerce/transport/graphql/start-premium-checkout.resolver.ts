import { Args, Mutation, Resolver } from "@nestjs/graphql"
import type { CommandBus } from "@nestjs/cqrs"
import { CurrentPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import { InjectCommandBus } from "@modules/platform/cqrs"
import { StartPremiumCheckoutCommand } from "../../application/start-premium-checkout.command"
import { toStartPremiumCheckoutParams, toStartPremiumCheckoutType } from "./start-premium-checkout.mapper"
import { StartPremiumCheckoutInput } from "./dto/start-premium-checkout.input"
import { StartPremiumCheckoutType } from "./dto/start-premium-checkout.type"

@Resolver()
/** GraphQL door of startPremiumCheckout: a signed-in learner starts paying for a plan. */
export class StartPremiumCheckoutResolver {
    constructor(@InjectCommandBus() private readonly commandBus: CommandBus) {}

    /** Starts a checkout for the caller; the price comes only from the server-owned offer. */
    @Mutation(() => StartPremiumCheckoutType, { name: "startPremiumCheckout" })
    async startPremiumCheckout(
        @CurrentPrincipal() identity: IdentityPrincipal,
        @Args("input") input: StartPremiumCheckoutInput,
    ): Promise<StartPremiumCheckoutType> {
        const result = await this.commandBus.execute(
            new StartPremiumCheckoutCommand(toStartPremiumCheckoutParams(identity, input)),
        )
        return toStartPremiumCheckoutType(result)
    }
}
