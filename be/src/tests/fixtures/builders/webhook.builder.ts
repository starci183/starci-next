import { createHmac } from "node:crypto"
import type { PurchaseService } from "@modules/domain/purchase"

/** The SePay IPN secret key the premium worlds hold. */
export const WEBHOOK_SEPAY_SECRET = "fake-sepay-ipn-secret"

/** The payOS checksum key the premium worlds hold. */
export const WEBHOOK_PAYOS_CHECKSUM = "fake-payos-checksum-key"

/** A key the deployment never held: a delivery proved with it proves nothing. */
export const WEBHOOK_FORGED_KEY = "a-key-the-deployment-never-held"

/** The amount every pending purchase of the webhook specs is priced at. */
export const WEBHOOK_AMOUNT = 229_000

/** A payment rail of the webhook specs. */
export type WebhookRail = "sepay" | "payos"

/** A JSON object of a provider body. */
type Json = Record<string, unknown>

/** What one SePay IPN reports: the order it pays, the transaction, and the fields a case changes. */
export interface SepayIpnFacts {
    readonly orderCode: string
    readonly reference: string
    readonly notificationType?: string
    readonly orderStatus?: string
    readonly currency?: string
    readonly transactionStatus?: string
}

/** A SePay IPN as its specification shapes it: by default an `ORDER_PAID`, `CAPTURED` in VND and `APPROVED`. */
export const sepayIpnOf = (facts: SepayIpnFacts): Json => ({
    timestamp: 1_790_000_000,
    notification_type: facts.notificationType ?? "ORDER_PAID",
    order: {
        order_invoice_number: facts.orderCode,
        order_amount: `${WEBHOOK_AMOUNT}.00`,
        order_currency: facts.currency ?? "VND",
        order_status: facts.orderStatus ?? "CAPTURED",
    },
    transaction: { transaction_id: facts.reference, transaction_status: facts.transactionStatus ?? "APPROVED" },
    customer: {},
})

/** The independent payOS signer: keys in code-unit order, `key=value` joined by `&`, lower-case hex HMAC-SHA256. */
const payosSign = (data: Json, key: string): string =>
    createHmac("sha256", key)
        .update(
            Object.keys(data)
                .sort((left, right) => (left < right ? -1 : 1))
                .map((name) => `${name}=${String(data[name])}`)
                .join("&"),
            "utf8",
        )
        .digest("hex")

/** The bytes of a payOS webhook that reports one order paid, signed under the given key. */
const payosBody = (orderCode: string, reference: string, key: string): Buffer => {
    const data: Json = {
        amount: WEBHOOK_AMOUNT,
        description: "Premium subscription",
        orderCode: Number(orderCode),
        reference,
    }
    return Buffer.from(
        JSON.stringify({ code: "00", desc: "success", success: true, data, signature: payosSign(data, key) }),
    )
}

/** One delivery as a provider posts it: the order it pays, the provider's own reference and the key it was proved with. */
export interface WebhookDelivery {
    readonly orderCode: string
    readonly reference: string
    readonly signedWith: string
}

/** The one domain intake each provider door calls, with the key a genuine delivery of that provider carries. */
export interface WebhookDoor {
    readonly rail: WebhookRail
    readonly genuineKey: string
    readonly deliver: (purchases: PurchaseService, delivery: WebhookDelivery) => Promise<unknown>
}

/** The two provider intakes, each with the key a genuine delivery carries. */
export const WEBHOOK_DOORS: ReadonlyArray<WebhookDoor> = [
    {
        rail: "sepay",
        genuineKey: WEBHOOK_SEPAY_SECRET,
        deliver: (purchases, { orderCode, reference, signedWith }) =>
            purchases.recordSepayDelivery({
                rawBody: Buffer.from(JSON.stringify(sepayIpnOf({ orderCode, reference }))),
                secretKey: signedWith,
            }),
    },
    {
        rail: "payos",
        genuineKey: WEBHOOK_PAYOS_CHECKSUM,
        deliver: (purchases, { orderCode, reference, signedWith }) =>
            purchases.recordPayosDelivery({ rawBody: payosBody(orderCode, reference, signedWith) }),
    },
]
