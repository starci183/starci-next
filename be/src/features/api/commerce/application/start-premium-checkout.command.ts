import { Command } from "@nestjs/cqrs"
import type { PurchaseCheckout } from "@modules/domain/purchase"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { StartPremiumCheckoutRequest } from "./start-premium-checkout.contracts"

/** Asks to start a Premium checkout for the authenticated learner. */
export class StartPremiumCheckoutCommand extends Command<PurchaseCheckout> {
    constructor(readonly params: ExecuteParams<StartPremiumCheckoutRequest>) {
        super()
    }
}
