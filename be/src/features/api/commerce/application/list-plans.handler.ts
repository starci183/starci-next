import { QueryHandler } from "@nestjs/cqrs"
import { PurchaseService } from "@modules/domain/purchase"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import type { ListPlansResult } from "./list-plans.contracts"
import { ListPlansQuery } from "./list-plans.query"

@QueryHandler(ListPlansQuery)
/** Answers the Premium plans the purchase capability owns. */
export class ListPlansHandler extends ICQRSHandler<ListPlansQuery, ListPlansResult> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly purchases: PurchaseService,
    ) {
        super(logger)
    }

    protected override process(): Promise<ListPlansResult> {
        return this.purchases.plans()
    }
}
