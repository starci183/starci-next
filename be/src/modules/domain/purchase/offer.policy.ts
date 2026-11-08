import type { Offer, PaymentRail } from "./purchase.contracts"

/** The server-owned commercial offers: the only source of Premium plans and prices. */
export const OFFERS: ReadonlyArray<Offer> = [
    { plan: "monthly", term: "monthly", amountVnd: 229_000, currency: "VND" },
    { plan: "yearly", term: "yearly", amountVnd: 2_290_000, currency: "VND" },
]

/** The rails a checkout can run on. */
export const PAYMENT_RAILS: ReadonlyArray<PaymentRail> = ["sepay", "payos"]
