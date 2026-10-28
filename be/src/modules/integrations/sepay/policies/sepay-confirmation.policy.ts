import { timingSafeEqual } from "node:crypto"
import type { SepayConfirmationHeaders } from "../sepay.contracts"

/** True when `body` is a plain record whose fields may be read. */
const isRecord = (body: unknown): body is Record<string, unknown> =>
    typeof body === "object" && body !== null && !Array.isArray(body)

/** The fields of a documented SePay IPN notification the rail acts on. */
export interface SepayIpn {
    /** The provider's notification kind; `ORDER_PAID` is the only paid one. */
    readonly notificationType: string
    /** The order object the notification carries. */
    readonly order: Record<string, unknown>
    /** The transaction object the notification carries. */
    readonly transaction: Record<string, unknown>
}

/** The paid-order facts of a verified IPN the rail acts on. */
export interface SepayOrder {
    /** The invoice number the order was created under. */
    readonly orderCode: string
    /** The amount SePay reports as paid, in the order's own currency. */
    readonly amount: number
    /** The provider's own transaction id. */
    readonly providerRef: string
}

/** True when `given` and `expected` hold the same bytes, compared in constant time. */
const equalText = (given: string, expected: string): boolean => {
    const left = Buffer.from(given, "utf8")
    const right = Buffer.from(expected, "utf8")
    return left.length === right.length && timingSafeEqual(left, right)
}

/** True when the delivery's `x-secret-key` header is exactly the configured IPN secret key, compared in constant time. */
export const sepayDeliveryAuthorized = (headers: SepayConfirmationHeaders, secretKey: string): boolean =>
    headers["x-secret-key"] !== undefined && equalText(headers["x-secret-key"], secretKey)

/** The fields of a posted body, or `null` when the body is not a readable SePay IPN notification. */
export const sepayIpnOf = (body: unknown): SepayIpn | null => {
    if (!isRecord(body)) return null
    const { timestamp, notification_type, order, transaction } = body
    if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) return null
    if (typeof notification_type !== "string" || notification_type === "") return null
    if (!isRecord(order) || !isRecord(transaction)) return null
    return { notificationType: notification_type, order, transaction }
}

/** The decimal `order_amount` of a notification, or `null` when it names no positive amount. */
const amountOf = (value: unknown): number | null => {
    const amount = amountValue(value)
    return Number.isFinite(amount) && amount > 0 ? amount : null
}

/** The numeric reading of an `order_amount` field: decimal text or a number, anything else `NaN`. */
const amountValue = (value: unknown): number => {
    if (typeof value === "string" && /^\d+(\.\d+)?$/.test(value)) return Number(value)
    if (typeof value === "number") return value
    return Number.NaN
}

/** The paid-order facts of a verified IPN, or `null` when it names no readable paid order. */
export const sepayOrderOf = (ipn: SepayIpn): SepayOrder | null => {
    const orderCode = ipn.order.order_invoice_number
    if (typeof orderCode !== "string" || orderCode === "") return null
    const amount = amountOf(ipn.order.order_amount)
    if (amount === null) return null
    const providerRef = ipn.transaction.transaction_id
    if (typeof providerRef !== "string" || providerRef === "") return null
    return { orderCode, amount, providerRef }
}
