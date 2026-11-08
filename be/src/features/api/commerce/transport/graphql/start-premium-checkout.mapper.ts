import { toPrincipal, type IdentityPrincipal } from "@modules/domain/identity"
import type { PurchaseCheckout } from "@modules/domain/purchase"
import type { ExecuteParams } from "@modules/platform/cqrs"
import type { StartPremiumCheckoutRequest } from "../../application/start-premium-checkout.contracts"
import type { StartPremiumCheckoutInput } from "./dto/start-premium-checkout.input"
import type { StartPremiumCheckoutType } from "./dto/start-premium-checkout.type"

/** Maps the GraphQL input and the session to the command params. */
export const toStartPremiumCheckoutParams = (
    identity: IdentityPrincipal,
    input: StartPremiumCheckoutInput,
): ExecuteParams<StartPremiumCheckoutRequest> => ({
    request: { plan: input.plan, rail: input.rail },
    principal: toPrincipal(identity),
})

/** Maps the started checkout to the GraphQL type. */
export const toStartPremiumCheckoutType = (result: PurchaseCheckout): StartPremiumCheckoutType => ({
    orderId: result.purchase.purchaseId,
    rail: result.rail,
    redirect: { method: result.redirect.method, url: result.redirect.url, fields: result.redirect.fields },
})
