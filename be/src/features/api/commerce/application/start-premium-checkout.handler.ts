import { CommandHandler } from "@nestjs/cqrs"
import { PurchaseService, type PurchaseCheckout } from "@modules/domain/purchase"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { StartPremiumCheckoutCommand } from "./start-premium-checkout.command"

@CommandHandler(StartPremiumCheckoutCommand)
/** Starts a Premium checkout for the authenticated learner through one purchase-service call. */
export class StartPremiumCheckoutHandler extends ICQRSHandler<StartPremiumCheckoutCommand, PurchaseCheckout> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly purchases: PurchaseService,
    ) {
        super(logger)
    }

    protected override process(command: StartPremiumCheckoutCommand): Promise<PurchaseCheckout> {
        return this.purchases.createCheckout({
            learnerId: command.params.principal.id,
            plan: command.params.request.plan,
            rail: command.params.request.rail,
        })
    }
}
