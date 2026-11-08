import { createHmac, timingSafeEqual } from "node:crypto"

/** The envelope of a documented payOS webhook body after its shape is read. */
export interface PayosWebhook {
    /** The provider result code of the notification; `"00"` is the only paid code. */
    readonly code: string
    /** Whether the provider marks the notification successful. */
    readonly success: boolean
    /** The data object the checksum signature is computed over. */
    readonly data: Record<string, unknown>
    /** The lower-case hex HMAC-SHA256 the provider computed over `data`. */
    readonly signature: string
}

/** The only currency payOS settles in; a webhook that names no currency is a VND transfer. */
const PAYOS_CURRENCY = "VND"

/** The transfer facts of a verified `data` object the rail acts on. */
export interface PayosTransaction {
    /** The order code the payment request was created under. */
    readonly orderCode: number
    /** The amount payOS reports as transferred. */
    readonly amount: number
    /** The provider's own transfer reference. */
    readonly reference: string
    /** The currency the transfer was made in: `data.currency`, or VND when the webhook names none. */
    readonly currency: string
}

/** True when `value` is a plain record whose fields may be read. */
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value)

/** Key order the way the provider's own signer serializes for signing: the default code-unit `sort()`. */
const byKey = (left: string, right: string): number => (left < right ? -1 : 1)

/** A copy of `value` whose objects have their keys sorted alphabetically, as the provider serializes them for signing. */
const sortedDeep = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map((item) => sortedDeep(item))
    if (!isRecord(value)) return value
    const out: Record<string, unknown> = {}
    for (const key of Object.keys(value).sort(byKey)) out[key] = sortedDeep(value[key])
    return out
}

/**
 * One `key=value` member of the canonical signature string, the way the provider's own signer writes it: `null`,
 * `undefined` and the literal strings `"null"`/`"undefined"` are empty, arrays and objects are JSON of their deep-sorted
 * form, and every other scalar is its own text.
 */
const canonicalValue = (value: unknown): string => {
    if (value === null || value === undefined) return ""
    if (typeof value === "string") return value === "null" || value === "undefined" ? "" : value
    if (typeof value === "object") return JSON.stringify(sortedDeep(value))
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value)
    return ""
}

/** The canonical `key=value&...` string of a webhook `data` object: keys sorted alphabetically, joined by `&`. */
export const payosCanonicalData = (data: Record<string, unknown>): string =>
    Object.keys(data)
        .sort(byKey)
        .map((key) => `${key}=${canonicalValue(data[key])}`)
        .join("&")

/** The lower-case hex HMAC-SHA256 of `data`'s canonical string under the channel checksum key. */
export const payosDataSignature = (data: Record<string, unknown>, checksumKey: string): string =>
    createHmac("sha256", checksumKey).update(payosCanonicalData(data), "utf8").digest("hex")

/** True when `signature` is the checksum-key signature of `data`, compared in constant time. */
export const payosSignatureValid = (data: Record<string, unknown>, signature: string, checksumKey: string): boolean => {
    const given = Buffer.from(signature.toLowerCase(), "utf8")
    const expected = Buffer.from(payosDataSignature(data, checksumKey), "utf8")
    return given.length === expected.length && timingSafeEqual(given, expected)
}

/** The envelope of a posted body, or `null` when the body is not a readable payOS webhook. */
export const payosWebhookOf = (body: unknown): PayosWebhook | null => {
    if (!isRecord(body)) return null
    const { code, success, data, signature } = body
    if (typeof code !== "string" || typeof success !== "boolean" || !isRecord(data) || typeof signature !== "string")
        return null
    return { code, success, data, signature }
}

/** The transfer facts of a verified `data` object, or `null` when it names no readable transfer. */
export const payosTransactionOf = (data: Record<string, unknown>): PayosTransaction | null => {
    const { orderCode, amount, reference } = data
    if (typeof orderCode !== "number" || !Number.isInteger(orderCode) || orderCode <= 0) return null
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) return null
    if (typeof reference !== "string" || reference === "") return null
    const currency = data.currency ?? PAYOS_CURRENCY
    if (typeof currency !== "string") return null
    return { orderCode, amount, reference, currency }
}
