import type { PaymentRail, Purchase, PurchaseStatus } from "../purchase.contracts"
import type { PremiumTerm } from "@modules/domain/entitlement"

/** The row purchase reads and writes return. */
export interface PurchaseRow {
    /** Purchase identifier. */
    purchase_id: string
    /** Learner identity. */
    learner_id: string
    /** Plan snapshot. */
    plan: PremiumTerm
    /** Price snapshot in whole VND. */
    amount_vnd: number
    /** Price currency. */
    currency: string
    /** Checkout rail. */
    rail: PaymentRail
    /** Order or invoice reference the provider echoes back. */
    order_code: string
    /** Provider transaction or link reference. */
    provider_ref: string | null
    /** Lifecycle state. */
    status: PurchaseStatus
    /** Creation instant. */
    created_at: Date
    /** Last change instant. */
    updated_at: Date
    /** Pending expiry instant. */
    expires_at: Date
    /** Settlement instant. */
    confirmed_at: Date | null
}

/** Maps a database row to the capability contract. */
export const toPurchase = (row: PurchaseRow): Purchase => ({
    purchaseId: row.purchase_id,
    learnerId: row.learner_id,
    plan: row.plan,
    amountVnd: row.amount_vnd,
    currency: row.currency,
    rail: row.rail,
    orderCode: row.order_code,
    providerRef: row.provider_ref,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    expiresAt: row.expires_at.toISOString(),
    confirmedAt: row.confirmed_at === null ? null : row.confirmed_at.toISOString(),
})
