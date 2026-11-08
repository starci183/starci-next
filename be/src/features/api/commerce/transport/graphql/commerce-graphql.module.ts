import { Module } from "@nestjs/common"
import { CommerceModule } from "../../commerce.module"
import { ConfigurableModuleClass } from "./commerce-graphql.module-definition"
import { GetMyPremiumResolver } from "./get-my-premium.resolver"
import { GetPremiumOrderResolver } from "./get-premium-order.resolver"
import { ListPlansResolver } from "./list-plans.resolver"
import { StartPremiumCheckoutResolver } from "./start-premium-checkout.resolver"

@Module({
    imports: [CommerceModule.register({})],
    providers: [ListPlansResolver, StartPremiumCheckoutResolver, GetPremiumOrderResolver, GetMyPremiumResolver],
})
/** The GraphQL transport of the commerce feature: the public plans read and the signed-in checkout, order and standing doors. */
export class CommerceGraphqlModule extends ConfigurableModuleClass {}
