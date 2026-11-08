import { Query } from "@nestjs/cqrs"
import type { PremiumOrder } from "@modules/domain/purchase"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetPremiumOrderRequest } from "./get-premium-order.contracts"

/** Asks for one order the authenticated learner started. */
export class GetPremiumOrderQuery extends Query<PremiumOrder> {
    constructor(readonly params: ExecuteParams<GetPremiumOrderRequest>) {
        super()
    }
}
