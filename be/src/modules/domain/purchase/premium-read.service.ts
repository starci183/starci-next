import { Injectable } from "@nestjs/common"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { orderStatusOf } from "./order-status.policy"
import type { PremiumOrder, PremiumStatus } from "./purchase.contracts"
import { PurchaseService } from "./purchase.service"

@Injectable()
/** The learner's own reads for the plans and checkout-result screens: their orders and their Premium standing. */
export class PremiumReadService {
    constructor(
        private readonly purchases: PurchaseService,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
    ) {}

    /**
     * One order of the learner as the result screen reads it: the state comes only from the stored purchase, which a
     * verified provider confirmation alone settles. A foreign or unknown id is not found; a settled order whose
     * entitlement has not landed yet is still being verified.
     */
    async premiumOrder(learnerId: string, orderId: string): Promise<PremiumOrder> {
        const purchase = await this.purchases.purchaseView(learnerId, orderId)
        const status = orderStatusOf(purchase.status)
        const premiumUntil = status === "active" ? await this.entitlement.premiumUntil({ learnerId }) : null
        return {
            orderId: purchase.purchaseId,
            status: status === "active" && premiumUntil === null ? "verifying" : status,
            plan: purchase.plan,
            amountVnd: purchase.amountVnd,
            rail: purchase.rail,
            orderCode: purchase.orderCode,
            premiumUntil,
        }
    }

    /** The learner's Premium standing for the plans screen: access now, its stored end and the rail to preselect. */
    async premiumStatus(learnerId: string): Promise<PremiumStatus> {
        const [isPremium, premiumUntil, lastRail] = await Promise.all([
            this.entitlement.isPremium(learnerId),
            this.entitlement.premiumUntil({ learnerId }),
            this.purchases.lastUsedRail(learnerId),
        ])
        return { isPremium, premiumUntil, lastRail }
    }
}
