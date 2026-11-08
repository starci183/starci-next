import { QueryHandler } from "@nestjs/cqrs"
import { PremiumReadService, type PremiumStatus } from "@modules/domain/purchase"
import { ICQRSHandler } from "@modules/platform/cqrs"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { GetMyPremiumQuery } from "./get-my-premium.query"

@QueryHandler(GetMyPremiumQuery)
/** Reads the authenticated learner's Premium standing through one purchase-service call. */
export class GetMyPremiumHandler extends ICQRSHandler<GetMyPremiumQuery, PremiumStatus> {
    constructor(
        @InjectLogger() logger: Logger,
        private readonly reads: PremiumReadService,
    ) {
        super(logger)
    }

    protected override process(query: GetMyPremiumQuery): Promise<PremiumStatus> {
        return this.reads.premiumStatus(query.params.principal.id)
    }
}
