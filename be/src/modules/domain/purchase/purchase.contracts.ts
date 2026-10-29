import type { Entitlement, PremiumTerm } from "@modules/domain/entitlement"

/** The payment rails a Premium purchase can settle on; each rail has its own independent provider integration. */
export type PaymentRail = "sepay" | "payos"

/** The lifecycle states of one purchase. */
export type PurchaseStatus = "pending" | "paid" | "failed" | "canceled" | "expired"

/** One server-owned commercial offer: the plan, its term and its fixed VND price. */
export interface Offer {
    /** The plan the learner selects. */
    readonly plan: PremiumTerm
    /** The entitlement term a paid purchase of this offer grants. */
    readonly term: PremiumTerm
    /** The fixed price in whole VND, snapshotted onto every purchase of this offer. */
    readonly amountVnd: number
    /** The currency of the price; always VND. */
    readonly currency: string
}

/** One purchase as the domain answers it. */
export interface Purchase {
    /** The purchase's own identifier. */
    readonly purchaseId: string
    /** The learner the purchase belongs to. */
    readonly learnerId: string
    /** The immutable plan snapshot. */
    readonly plan: PremiumTerm
    /** The immutable VND price snapshot. */
    readonly amountVnd: number
    /** The currency of the price snapshot; always VND. */
    readonly currency: string
    /** The rail the checkout runs on. */
    readonly rail: PaymentRail
    /** The order or invoice reference the provider echoes back in its confirmation. */
    readonly orderCode: string
    /** The provider's own transaction or link reference, once the provider reports one. */
    readonly providerRef: string | null
    /** The purchase's current lifecycle state. */
    readonly status: PurchaseStatus
    /** The instant the purchase was created. */
    readonly createdAt: string
    /** The instant the purchase last changed. */
    readonly updatedAt: string
    /** The instant a still-pending purchase lapses to expired. */
    readonly expiresAt: string
    /** The instant a verified confirmation settled the purchase, when it has. */
    readonly confirmedAt: string | null
}

/** Where the buyer's browser is sent after the provider checkout; display only, never payment proof. */
export interface CheckoutRedirect {
    /** The HTTP method the browser follows. */
    readonly method: "GET" | "POST"
    /** The checkout or form-action URL. */
    readonly url: string
    /** The signed form fields the browser posts, when the rail uses a form. */
    readonly fields?: Readonly<Record<string, string>>
}

/** A purchase and the provider checkout that takes the buyer to pay it. */
export interface PurchaseCheckout {
    /** The purchase the checkout settles. */
    readonly purchase: Purchase
    /** The rail the checkout was created on. */
    readonly rail: PaymentRail
    /** Where the buyer is sent to pay. */
    readonly redirect: CheckoutRedirect
}

/** What a checkout creation is given: the authenticated learner, the plan, the buyer's return addresses and the request correlation id. */
export interface CreateCheckoutInput {
    /** The learner starting the purchase. */
    readonly learnerId: string
    /** The server-owned offer the learner selected; a name no offer carries is refused. */
    readonly plan: string
    /** The rail to checkout on; absent, the learner's last-used rail, otherwise SePay. */
    readonly rail?: PaymentRail
    /** Where the provider sends the buyer after a successful payment; display only. */
    readonly successUrl: string
    /** Where the provider sends the buyer after a failed payment. */
    readonly errorUrl: string
    /** Where the provider sends the buyer who cancels. */
    readonly cancelUrl: string
    /** The correlation id of the calling request, forwarded to the provider where the rail takes one. */
    readonly correlationId: string
}

/** One verified provider confirmation the intake applies: the rail proved it, the domain matches it. */
export interface RailConfirmation {
    /** The rail that produced the confirmation. */
    readonly rail: PaymentRail
    /** The order or invoice reference the purchase was created under. */
    readonly orderCode: string
    /** The provider's own transaction or transfer reference; the idempotency identity's second half. */
    readonly providerRef: string
    /** The amount the provider reports as paid, in the purchase's own currency. */
    readonly amount: number
}

/** What a delivery intake answers internally: the entitlement it applied, or null on a duplicate. */
export interface PurchaseSettlement {
    /** The entitlement the confirmation granted after commit, or null when the confirmation was a recorded duplicate. */
    readonly granted: Entitlement | null
}

/** The raw SePay IPN delivery the webhook door hands to the domain intake; nothing in it is trusted yet. */
export interface SepayDeliveryInput {
    /** The unparsed request bytes of the delivery. */
    readonly rawBody: Buffer | undefined
    /** The `x-secret-key` header the delivery carried. */
    readonly secretKey: string | undefined
}

/** The raw payOS webhook delivery the door hands to the domain intake; nothing in it is trusted yet. */
export interface PayosDeliveryInput {
    /** The unparsed request bytes of the delivery. */
    readonly rawBody: Buffer | undefined
}
