import { ApiFailure } from "@/modules/failure"

/** Why starting a checkout did not send the reader to pay, by the stable error code the server answered. */
export type CheckoutFailure = "session" | "refused" | "other"

/** Maps the failure of a start to what the screen words, by its stable `extensions.code`; the message and status are never read. */
export const checkoutFailureOf = (error: unknown): CheckoutFailure => {
    const code = error instanceof ApiFailure ? error.code : undefined
    if (code === "IDENTITY_SESSION_REQUIRED") return "session"
    if (code === "PURCHASE_CHECKOUT_REFUSED") return "refused"
    return "other"
}

/** The stable code of an order that does not exist or is not the reader's. */
const ORDER_NOT_FOUND_CODE = "PURCHASE_ORDER_NOT_FOUND"

/** True when the failure of an order read says the order does not exist for this reader. */
export const isOrderNotFound = (error: unknown): boolean =>
    error instanceof ApiFailure && error.code === ORDER_NOT_FOUND_CODE
