import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { PremiumStatus } from "@modules/domain/purchase"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetMyPremiumRequest } from "../../application/get-my-premium.contracts"
import type { MyPremiumType } from "./dto/my-premium.type"

/** Maps the session to the query params; the query takes no input. */
export const toGetMyPremiumParams = (identity: IdentityPrincipal): ExecuteParams<GetMyPremiumRequest> => ({
    request: {},
    principal: toPrincipal(identity),
})

/** Maps the learner Premium standing to the GraphQL type. */
export const toMyPremiumType = (result: PremiumStatus): MyPremiumType => ({
    isPremium: result.isPremium,
    premiumUntil: result.premiumUntil,
    lastRail: result.lastRail,
})
