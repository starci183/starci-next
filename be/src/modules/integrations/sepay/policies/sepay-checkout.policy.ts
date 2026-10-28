import { createHmac } from "node:crypto"
import type { SepayCheckoutInput } from "../sepay.contracts"

/** The currency the rail charges in. */
const CURRENCY = "VND"

/** The only transaction kind a one-time payment form carries. */
const OPERATION = "PURCHASE"

/** True when `value` is an absolute http(s) URL the buyer can be sent back to. */
const returnable = (value: string): boolean => {
    if (!URL.canParse(value)) return false
    const { protocol } = new URL(value)
    return protocol === "https:" || protocol === "http:"
}

/** True when the request names a payable order and three return addresses. */
export const sepayCheckoutPayable = (input: SepayCheckoutInput): boolean =>
    input.orderCode !== "" &&
    Number.isSafeInteger(input.amount) &&
    input.amount > 0 &&
    [input.successUrl, input.errorUrl, input.cancelUrl].every(returnable)

/**
 * The unsigned form fields of a one-time payment in the order SePay's specification signs them: merchant, operation,
 * invoice number, amount, currency, description, then the success, error and cancel URLs.
 */
export const sepayCheckoutFields = (input: SepayCheckoutInput, merchantId: string): Record<string, string> => ({
    merchant: merchantId,
    operation: OPERATION,
    order_invoice_number: input.orderCode,
    order_amount: String(input.amount),
    currency: CURRENCY,
    ...(input.description === undefined ? {} : { order_description: input.description }),
    success_url: input.successUrl,
    error_url: input.errorUrl,
    cancel_url: input.cancelUrl,
})

/** The base64 HMAC-SHA256 of `field=value` pairs joined by commas, in the order the fields are given, under the signing key. */
export const sepayCheckoutSignature = (fields: Readonly<Record<string, string>>, signingKey: string): string =>
    createHmac("sha256", signingKey)
        .update(
            Object.entries(fields)
                .map(([name, value]) => `${name}=${value}`)
                .join(","),
            "utf8",
        )
        .digest("base64")
