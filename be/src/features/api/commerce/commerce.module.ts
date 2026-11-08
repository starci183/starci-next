import { Module } from "@nestjs/common"
import { GetMyPremiumHandler } from "./application/get-my-premium.handler"
import { GetPremiumOrderHandler } from "./application/get-premium-order.handler"
import { ListPlansHandler } from "./application/list-plans.handler"
import { StartPremiumCheckoutHandler } from "./application/start-premium-checkout.handler"
import { ConfigurableModuleClass } from "./commerce.module-definition"

@Module({
    providers: [ListPlansHandler, StartPremiumCheckoutHandler, GetPremiumOrderHandler, GetMyPremiumHandler],
})
/** Application handlers of the commerce feature: the Premium offers read, the checkout start and the learner's own order and standing reads. */
export class CommerceModule extends ConfigurableModuleClass {}
