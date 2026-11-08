import type { OrderStatus, PurchaseStatus } from "./purchase.contracts"

/** The display state of an order: only a settled purchase is active, a closed one failed or expired, everything else is still being verified. */
export const orderStatusOf = (status: PurchaseStatus): OrderStatus => {
    if (status === "paid") return "active"
    if (status === "expired") return "expired"
    if (status === "failed" || status === "canceled" || status === "voided") return "failed"
    return "verifying"
}
