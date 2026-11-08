import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { PremiumOrder } from "@modules/domain/purchase"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { GetPremiumOrderRequest } from "../../application/get-premium-order.contracts"
import type { PremiumOrderInput } from "./dto/premium-order.input"
import type { PremiumOrderType } from "./dto/premium-order.type"

/** Maps the GraphQL input and the session to the query params. */
export const toGetPremiumOrderParams = (
    identity: IdentityPrincipal,
    input: PremiumOrderInput,
): ExecuteParams<GetPremiumOrderRequest> => ({ request: { orderId: input.orderId }, principal: toPrincipal(identity) })

/** Maps the order to the GraphQL type. */
export const toPremiumOrderType = (result: PremiumOrder): PremiumOrderType => ({
    orderId: result.orderId,
    status: result.status,
    plan: result.plan,
    amountVnd: result.amountVnd,
    rail: result.rail,
    orderCode: result.orderCode,
    premiumUntil: result.premiumUntil,
})
