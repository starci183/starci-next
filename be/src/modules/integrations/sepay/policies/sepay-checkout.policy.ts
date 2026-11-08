import { createHmac } from "node:crypto"
import type { SepayCheckoutInput } from "../sepay.contracts"

/** The currency the rail charges in. */
const CURRENCY = "VND"

/** The only transaction kind a one-time payment form carries. */
const OPERATION = "PURCHASE"

/**
 * The fields SePay's create-order form signs, in the fixed order its specification lists them
 * (developer.sepay.vn, cong-thanh-toan/API/don-hang/form-thanh-toan). The signature covers them in this order and no
 * other, and the form posts them in the same order.
 */
export const SEPAY_SIGNED_FIELDS: ReadonlyArray<string> = [
    "order_amount",
    "merchant",
    "currency",
    "operation",
    "order_description",
    "order_invoice_number",
    "customer_id",
    "payment_method",
    "success_url",
    "error_url",
    "cancel_url",
]

/** True when SePay signs the value: the specification leaves out empty values, `0` and `"0"`. */
const signable = (value: string | undefined): value is string => value !== undefined && value !== "" && value !== "0"

/** True when `value` is an absolute http(s) URL the buyer can be sent back to. */
const returnable = (value: string): boolean => {
    if (!URL.canParse(value)) return false
    const { protocol } = new URL(value)
    return protocol === "https:" || protocol === "http:"
}

/** True when the request names a payable order, the description SePay requires and three return addresses. */
export const sepayCheckoutPayable = (input: SepayCheckoutInput): boolean =>
    input.orderCode !== "" &&
    input.description.trim() !== "" &&
    Number.isSafeInteger(input.amount) &&
    input.amount > 0 &&
    [input.successUrl, input.errorUrl, input.cancelUrl].every((url) => returnable(url))

/**
 * The unsigned form fields of a one-time payment, in the order SePay's specification signs them (`SEPAY_SIGNED_FIELDS`);
 * a field without a value is left out, as the specification says.
 */
export const sepayCheckoutFields = (input: SepayCheckoutInput, merchantId: string): Record<string, string> => {
    const values: Readonly<Record<string, string>> = {
        order_amount: String(input.amount),
        merchant: merchantId,
        currency: CURRENCY,
        operation: OPERATION,
        order_description: input.description,
        order_invoice_number: input.orderCode,
        success_url: input.successUrl,
        error_url: input.errorUrl,
        cancel_url: input.cancelUrl,
    }
    const fields: Record<string, string> = {}
    for (const name of SEPAY_SIGNED_FIELDS) {
        const value = values[name]
        if (signable(value)) fields[name] = value
    }
    return fields
}

/** The `field=value,...` text SePay signs: the signed fields in the specification's order, empty values left out. */
export const sepaySigningText = (fields: Readonly<Record<string, string>>): string =>
    SEPAY_SIGNED_FIELDS.flatMap((name) => {
        const value = fields[name]
        return signable(value) ? [`${name}=${value}`] : []
    }).join(",")

/** The base64 HMAC-SHA256 of the signing text under the signing key, as SePay's specification computes it. */
export const sepayCheckoutSignature = (fields: Readonly<Record<string, string>>, signingKey: string): string =>
    createHmac("sha256", signingKey).update(sepaySigningText(fields), "utf8").digest("base64")
