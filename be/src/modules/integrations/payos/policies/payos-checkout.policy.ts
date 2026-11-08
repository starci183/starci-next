import type { PayosCheckoutInput } from "../payos.contracts"
import { payosDataSignature } from "./payos-confirmation.policy"

/** The signed JSON body of `POST /v2/payment-requests`. */
export interface PayosPaymentRequest {
    /** The unique order code. */
    readonly orderCode: number
    /** The amount to charge. */
    readonly amount: number
    /** The payment description. */
    readonly description: string
    /** The success redirect. */
    readonly returnUrl: string
    /** The cancel redirect. */
    readonly cancelUrl: string
    /** The lower-case hex HMAC-SHA256 of the sorted amount, cancelUrl, description, orderCode and returnUrl fields. */
    readonly signature: string
}

/** The envelope of a payment-request answer after its shape is read. */
export interface PayosPaymentAnswer {
    /** The provider result code; `"00"` is success. */
    readonly code: string
    /** The data object the answer signature covers, when the answer has one. */
    readonly data: Record<string, unknown> | null
    /** The answer signature, when the answer has one. */
    readonly signature: string | null
}

/** The payment link a signed successful answer names. */
export interface PayosPaymentLink {
    /** The provider's payment link id. */
    readonly paymentLinkId: string
    /** The hosted checkout page the buyer is sent to. */
    readonly checkoutUrl: string
}

/** The state of an existing payment request a signed read answer names. */
export interface PayosRequestState {
    /** The provider's payment link id (`id` of the get-payment-request answer). */
    readonly paymentLinkId: string
    /** The request status; only `"PENDING"` is still payable. */
    readonly status: string
}

/** The hosted checkout page of one payment link, `https://pay.payos.vn/web/<paymentLinkId>`. */
const HOSTED_CHECKOUT_BASE = "https://pay.payos.vn/web/"

/** True when `value` is a plain record whose fields may be read. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

/** True when `value` is an absolute http(s) URL. */
const absolute = (value: string): boolean => {
    if (!URL.canParse(value)) return false
    const { protocol } = new URL(value)
    return protocol === "https:" || protocol === "http:"
}

/** True when the request names a payable order, a description and two return addresses. */
export const payosCheckoutPayable = (input: PayosCheckoutInput): boolean =>
    Number.isSafeInteger(input.orderCode) &&
    input.orderCode > 0 &&
    Number.isSafeInteger(input.amount) &&
    input.amount > 0 &&
    input.description !== "" &&
    absolute(input.returnUrl) &&
    absolute(input.cancelUrl)

/** The request body for `input`, signed under the channel checksum key. */
export const payosPaymentRequest = (input: PayosCheckoutInput, checksumKey: string): PayosPaymentRequest => {
    const { orderCode, amount, description, returnUrl, cancelUrl } = input
    return {
        orderCode,
        amount,
        description,
        returnUrl,
        cancelUrl,
        signature: payosDataSignature({ amount, cancelUrl, description, orderCode, returnUrl }, checksumKey),
    }
}

/** The envelope of an answer body, or `null` when the body is not a readable payOS answer. */
export const payosPaymentAnswerOf = (body: unknown): PayosPaymentAnswer | null => {
    if (!isRecord(body) || typeof body.code !== "string") return null
    return {
        code: body.code,
        data: isRecord(body.data) ? body.data : null,
        signature: typeof body.signature === "string" ? body.signature : null,
    }
}

/** The payment link of an already signature-verified `data` object, or `null` when it is not the link of the order asked for. */
export const payosPaymentLinkOf = (
    data: Record<string, unknown>,
    input: PayosCheckoutInput,
): PayosPaymentLink | null => {
    const { paymentLinkId, checkoutUrl, orderCode, amount } = data
    if (typeof paymentLinkId !== "string" || paymentLinkId === "") return null
    if (typeof checkoutUrl !== "string" || !absolute(checkoutUrl)) return null
    if (orderCode !== input.orderCode || amount !== input.amount) return null
    return { paymentLinkId, checkoutUrl }
}

/** The state of the payment request of the order asked for in an already signature-verified read `data`, or `null` when it is not that request. */
export const payosRequestStateOf = (
    data: Record<string, unknown>,
    input: PayosCheckoutInput,
): PayosRequestState | null => {
    const { id, status, orderCode, amount } = data
    if (typeof id !== "string" || id === "" || typeof status !== "string") return null
    if (orderCode !== input.orderCode || amount !== input.amount) return null
    return { paymentLinkId: id, status }
}

/** True when a request in `state` can still be paid. */
export const payosRequestPayable = (state: PayosRequestState): boolean => state.status === "PENDING"

/** The hosted checkout address of a payment link id; the read answer carries no `checkoutUrl`. */
export const payosHostedCheckoutUrl = (paymentLinkId: string): string =>
    `${HOSTED_CHECKOUT_BASE}${encodeURIComponent(paymentLinkId)}`
