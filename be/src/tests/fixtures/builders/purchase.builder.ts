import type { SepayConfirmation } from "@modules/integrations/sepay"

/** The instant the purchase unit specs run at. */
export const PURCHASE_NOW = "2026-01-01T00:00:00.000Z"

/** The instant a fresh pending purchase expires at. */
export const PURCHASE_LATER = "2026-01-02T00:00:00.000Z"

/** An expiry already past at `PURCHASE_NOW`. */
export const PURCHASE_EXPIRED_AT = "2025-12-31T00:00:00.000Z"

/** The learner of the purchase unit specs. */
export const PURCHASE_LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"

/** The purchase of the purchase unit specs. */
export const PURCHASE_ID = "11111111-1111-4111-8111-111111111111"

/** A purchase as its table answers it. */
export interface PurchaseRowShape {
    purchase_id: string
    learner_id: string
    plan: "monthly" | "yearly"
    amount_vnd: number
    currency: string
    rail: "sepay" | "payos"
    order_code: string
    provider_ref: string | null
    status: "pending" | "paid" | "failed" | "canceled" | "expired" | "voided"
    created_at: Date
    updated_at: Date
    expires_at: Date
    confirmed_at: Date | null
}

/** A pending monthly SePay purchase row; override the fields that matter to the case. */
export const purchaseRowOf = (overrides?: Partial<PurchaseRowShape>): PurchaseRowShape => ({
    purchase_id: PURCHASE_ID,
    learner_id: PURCHASE_LEARNER,
    plan: "monthly",
    amount_vnd: 229_000,
    currency: "VND",
    rail: "sepay",
    order_code: "SE-7",
    provider_ref: null,
    status: "pending",
    created_at: new Date(PURCHASE_NOW),
    updated_at: new Date(PURCHASE_NOW),
    expires_at: new Date(PURCHASE_LATER),
    confirmed_at: null,
    ...overrides,
})

/** The row of that purchase once paid by transaction `tx-1`. */
export const paidPurchaseRowOf = (): PurchaseRowShape =>
    purchaseRowOf({ status: "paid", provider_ref: "tx-1", confirmed_at: new Date(PURCHASE_NOW) })

/** A verified paid SePay confirmation of that purchase; override the fields that matter to the case. */
export const sepayConfirmationOf = (overrides?: Partial<SepayConfirmation>): SepayConfirmation => ({
    rail: "sepay",
    state: "paid",
    providerRef: "tx-1",
    orderCode: "SE-7",
    amount: 229_000,
    currency: "VND",
    ...overrides,
})
