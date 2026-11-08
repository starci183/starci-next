import { QueryHandler } from "@nestjs/cqrs"
import { PremiumReadService, type PremiumOrder } from "@modules/domain/purchase"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetPremiumOrderQuery } from "./get-premium-order.query"

@QueryHandler(GetPremiumOrderQuery)
/** Reads one order of the authenticated learner through one purchase-service call. */
export class GetPremiumOrderHandler extends ICQRSHandler<GetPremiumOrderQuery, PremiumOrder> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: PremiumReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetPremiumOrderQuery): Promise<PremiumOrder> {
        return this.reads.premiumOrder(query.params.principal.id, query.params.request.orderId)
    }
}
