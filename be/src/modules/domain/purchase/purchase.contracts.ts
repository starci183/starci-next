import type { Entitlement, PremiumTerm } from "@modules/domain/entitlement"

/** The payment rails a Premium purchase can settle on; each rail has its own independent provider integration. */
export type PaymentRail = "sepay" | "payos"

/** A rail, or null when the learner never used one. */
export type OptionalRail = PaymentRail | null

/** The lifecycle states of one purchase. */
export type PurchaseStatus = "pending" | "paid" | "failed" | "canceled" | "expired" | "voided"

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

/** One signed form field a rail's redirect posts. */
export interface CheckoutField {
    /** The form field name. */
    readonly name: string
    /** The form field value. */
    readonly value: string
}

/** Where the buyer's browser is sent after the provider checkout; display only, never payment proof. */
export interface CheckoutRedirect {
    /** The HTTP method the browser follows. */
    readonly method: "GET" | "POST"
    /** The checkout or form-action URL. */
    readonly url: string
    /** The signed form fields the browser posts; empty when the rail redirects with a plain GET. */
    readonly fields: ReadonlyArray<CheckoutField>
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

/** What a checkout creation is given: the authenticated learner and the two names the learner chose; every price, return address and reference is the server's. */
export interface CreateCheckoutInput {
    /** The learner starting the purchase. */
    readonly learnerId: string
    /** The server-owned offer the learner selected; a name no offer carries is refused. */
    readonly plan: string
    /** The rail to checkout on; absent, the learner's last-used rail, otherwise SePay; a name no rail carries is refused. */
    readonly rail: string | null
}

/** What the checkout-result screen reads about one order: a display state derived from the purchase, never from a return URL. */
export type OrderStatus = "verifying" | "active" | "failed" | "expired"

/** One order of one learner as the result screen reads it. */
export interface PremiumOrder {
    /** The order's own identifier. */
    readonly orderId: string
    /** The order's display state. */
    readonly status: OrderStatus
    /** The immutable plan snapshot. */
    readonly plan: PremiumTerm
    /** The immutable VND price snapshot. */
    readonly amountVnd: number
    /** The rail the order was started on. */
    readonly rail: PaymentRail
    /** The order or invoice reference the provider echoes back. */
    readonly orderCode: string
    /** The learner's Premium end once the order is active, otherwise null. */
    readonly premiumUntil: string | null
}

/** What the plans screen reads about the learner: current access, its end and the rail to preselect. */
export interface PremiumStatus {
    /** Whether the stored end is later than now. */
    readonly isPremium: boolean
    /** The stored Premium end, or null when the learner never held Premium. */
    readonly premiumUntil: string | null
    /** The rail of the learner's latest order, or null when they never bought. */
    readonly lastRail: OptionalRail
}

/** What a verified provider delivery reports: a paid order, a voided payment, or neither. */
export type ConfirmationState = "paid" | "voided" | "unpaid"

/** One verified provider confirmation the intake applies: the rail proved it, the domain matches it. */
export interface RailConfirmation {
    /** The rail that produced the confirmation. */
    readonly rail: PaymentRail
    /** What the delivery reports; only a paid one can settle a purchase. */
    readonly state: ConfirmationState
    /** The order or invoice reference the purchase was created under. */
    readonly orderCode: string
    /** The provider's own transaction or transfer reference; the idempotency identity's second half. */
    readonly providerRef: string
    /** The amount the provider reports as paid. */
    readonly amount: number
    /** The currency the provider reports the payment in; only VND settles. */
    readonly currency: string
}

/**
 * Why a verified delivery was recorded and not applied: it names no persisted order, a second payment of a paid order,
 * a purchase closed as failed, another amount or currency, a payment the provider does not report paid, or a voided one.
 */
export type ConfirmationRefusal =
    "order-unknown" | "already-paid" | "not-payable" | "amount-mismatch" | "currency-mismatch" | "not-paid" | "voided"

/**
 * What a delivery intake answers internally: the entitlement it granted in the settlement transaction, a duplicate of a
 * recorded confirmation, or a verified delivery it recorded as refused. The provider is acknowledged in every case.
 */
export type PurchaseSettlement =
    | { readonly outcome: "granted"; readonly granted: Entitlement }
    | { readonly outcome: "revoked"; readonly entitlement: Entitlement }
    | { readonly outcome: "duplicate" }
    | { readonly outcome: "refused"; readonly reason: ConfirmationRefusal }

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
