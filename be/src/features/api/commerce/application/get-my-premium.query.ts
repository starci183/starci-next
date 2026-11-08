import { Query } from "@nestjs/cqrs"
import type { PremiumStatus } from "@modules/domain/purchase"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMyPremiumRequest } from "./get-my-premium.contracts"

/** Asks for the authenticated learner's Premium standing. */
export class GetMyPremiumQuery extends Query<PremiumStatus> {
    constructor(readonly params: ExecuteParams<GetMyPremiumRequest>) {
        super()
    }
}
