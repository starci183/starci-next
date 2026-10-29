import { createHmac } from "node:crypto"
import { createServer } from "node:http"
import type { IncomingHttpHeaders, Server } from "node:http"
import type { AddressInfo } from "node:net"
import { builder } from "@starci/jest-preset"
import { PayosErrorCode, PayosModule, PAYOS_CLIENT, parsePayosConfig } from "@modules/integrations/payos"
import type { PayosClient, PayosOptions } from "@modules/integrations/payos"
import { SepayErrorCode, SepayModule, SEPAY_CLIENT, parseSepayConfig } from "@modules/integrations/sepay"
import type { SepayClient } from "@modules/integrations/sepay"
import { EnvSource } from "@modules/platform/config"
import { HttpModule } from "@modules/platform/http"
import { useTestWorld } from "../../world/use-test-world"

const SEPAY_SECRET = "fake-sepay-ipn-secret"
const SEPAY_SIGNING = "fake-sepay-signing-key"
const PAYOS_CHECKSUM = "fake-payos-checksum-key"

/** One answer the local payOS stand-in gives, and the calls it received. */
interface EdgeAnswer {
    readonly status: number
    readonly body: unknown
}

interface EdgeCall {
    readonly path: string
    readonly headers: IncomingHttpHeaders
    readonly body: Record<string, unknown>
}

const sepayEnvOf = builder<Record<string, string>>({
    SEPAY_IPN_SECRET_KEY: SEPAY_SECRET,
    SEPAY_MERCHANT_ID: "SP-TEST-MERCHANT",
    SEPAY_SIGNING_SECRET_KEY: SEPAY_SIGNING,
    SEPAY_CHECKOUT_URL: "https://sandbox.pay.sepay.test/v1/checkout/init",
})

const sepayIpnOf = builder<Record<string, unknown>>({
    timestamp: 1_790_000_000,
    notification_type: "ORDER_PAID",
    order: { order_invoice_number: "SEPAY-1001", order_amount: "99000.00" },
    transaction: { transaction_id: "sp-tx-1001" },
    customer: {},
})

const sepayCheckoutOf = builder({
    orderCode: "SEPAY-1001",
    amount: 99_000,
    description: "StarCi Premium monthly",
    successUrl: "https://app.starci.test/pay/success",
    errorUrl: "https://app.starci.test/pay/error",
    cancelUrl: "https://app.starci.test/pay/cancel",
})

const payosDataOf = builder<Record<string, unknown>>({
    amount: 99_000,
    description: "StarCi Premium monthly",
    orderCode: 1_001,
    reference: "FT-1001",
})

const payosCheckoutOf = builder({
    orderCode: 1_001,
    amount: 99_000,
    description: "StarCi Premium monthly",
    returnUrl: "https://app.starci.test/pay/return",
    cancelUrl: "https://app.starci.test/pay/cancel",
    correlationId: "corr-1001",
})

/** The independent signer of the payOS scheme: keys sorted, `key=value` joined by `&`, lower-case hex HMAC-SHA256. */
const payosSign = (data: Record<string, unknown>): string =>
    createHmac("sha256", PAYOS_CHECKSUM)
        .update(
            Object.keys(data)
                .sort()
                .map((key) => `${key}=${String(data[key])}`)
                .join("&"),
            "utf8",
        )
        .digest("hex")

const payosWebhookOf = (data: Record<string, unknown>, over: Record<string, unknown> = {}): Record<string, unknown> => ({
    code: "00",
    desc: "success",
    success: true,
    data,
    signature: payosSign(data),
    ...over,
})

/** The independent signer of the SePay checkout form: `field=value` pairs joined by commas, base64 HMAC-SHA256. */
const sepaySign = (fields: Record<string, string>): string =>
    createHmac("sha256", SEPAY_SIGNING)
        .update(
            Object.entries(fields)
                .map(([name, value]) => `${name}=${value}`)
                .join(","),
            "utf8",
        )
        .digest("base64")

/** The real SePay and payOS clients over the local stack, with the payOS merchant API stood in at the network edge. */
describe("payment rails (integration)", () => {
    const calls: Array<EdgeCall> = []
    let answer: EdgeAnswer = { status: 200, body: {} }
    let edge: Server | undefined
    let apiBase = ""

    beforeAll(async () => {
        edge = createServer((request, response) => {
            const chunks: Array<Buffer> = []
            request.on("data", (chunk: Buffer) => chunks.push(chunk))
            request.on("end", () => {
                const parsed: Record<string, unknown> = JSON.parse(Buffer.concat(chunks).toString("utf8"))
                calls.push({ path: request.url ?? "", headers: request.headers, body: parsed })
                if (answer.status === 0) {
                    request.socket.destroy()
                    return
                }
                response.writeHead(answer.status, { "content-type": "application/json" })
                response.end(JSON.stringify(answer.body))
            })
        })
        await new Promise<void>((resolve) => edge?.listen(0, "127.0.0.1", resolve))
        apiBase = `http://127.0.0.1:${String((edge?.address() as AddressInfo).port)}`
    })

    afterAll(async () => {
        await new Promise<void>((resolve) => (edge ? edge.close(() => resolve()) : resolve()))
    })

    beforeEach(() => {
        calls.length = 0
        answer = { status: 200, body: {} }
    })

    const world = useTestWorld({
        modules: [
            () => SepayModule.register({ channel: parseSepayConfig(new EnvSource(sepayEnvOf())) }),
            () => {
                const channel: PayosOptions | null = parsePayosConfig(
                    new EnvSource({
                        PAYOS_CHECKSUM_KEY: PAYOS_CHECKSUM,
                        PAYOS_CLIENT_ID: "payos-client-id",
                        PAYOS_API_KEY: "fake-payos-api-key",
                        PAYOS_API_BASE: `${apiBase}/`,
                        PAYOS_TIMEOUT: "2s",
                    }),
                )
                return { ...PayosModule.register({ channel }), imports: [HttpModule.register({})] }
            },
        ],
    })
    const sepay = (): SepayClient => world.resolve(SEPAY_CLIENT)
    const payos = (): PayosClient => world.resolve(PAYOS_CLIENT)

    describe("SePay IPN confirmation", () => {
        it("proves a paid IPN carrying the configured secret into the shared confirmation shape", () => {
            const outcome = sepay().verifyConfirmation({
                body: sepayIpnOf(),
                headers: { "x-secret-key": SEPAY_SECRET },
            })

            expect(outcome).toEqual({
                kind: "ok",
                value: { rail: "sepay", providerRef: "sp-tx-1001", orderCode: "SEPAY-1001", amount: 99_000 },
            })
        })

        it("refuses a forged IPN whose secret key differs by one character", () => {
            const outcome = sepay().verifyConfirmation({
                body: sepayIpnOf(),
                headers: { "x-secret-key": `${SEPAY_SECRET}x` },
            })

            expect(outcome).toEqual({ kind: "refused", code: SepayErrorCode.SecretInvalid })
        })

        it("refuses an IPN that carries no secret key header", () => {
            expect(sepay().verifyConfirmation({ body: sepayIpnOf(), headers: {} })).toEqual({
                kind: "refused",
                code: SepayErrorCode.SecretInvalid,
            })
        })

        it("refuses an authenticated delivery whose body is not an IPN envelope", () => {
            const headers = { "x-secret-key": SEPAY_SECRET }

            expect(sepay().verifyConfirmation({ body: "paid", headers })).toEqual({
                kind: "refused",
                code: SepayErrorCode.PayloadMalformed,
            })
            expect(sepay().verifyConfirmation({ body: sepayIpnOf({ transaction: null }), headers })).toEqual({
                kind: "refused",
                code: SepayErrorCode.PayloadMalformed,
            })
        })

        it("refuses an authenticated notification that does not report the order paid", () => {
            const outcome = sepay().verifyConfirmation({
                body: sepayIpnOf({ notification_type: "TRANSACTION_VOID" }),
                headers: { "x-secret-key": SEPAY_SECRET },
            })

            expect(outcome).toEqual({ kind: "refused", code: SepayErrorCode.PaymentNotConfirmed })
        })

        it("refuses a paid IPN whose order names no positive amount", () => {
            const outcome = sepay().verifyConfirmation({
                body: sepayIpnOf({ order: { order_invoice_number: "SEPAY-1001", order_amount: "0" } }),
                headers: { "x-secret-key": SEPAY_SECRET },
            })

            expect(outcome).toEqual({ kind: "refused", code: SepayErrorCode.PayloadMalformed })
        })
    })

    describe("SePay checkout", () => {
        it("signs the one-time payment form with the signing key in the specified field order", () => {
            const outcome = sepay().createCheckout(sepayCheckoutOf())
            const unsigned = {
                merchant: "SP-TEST-MERCHANT",
                operation: "PURCHASE",
                order_invoice_number: "SEPAY-1001",
                order_amount: "99000",
                currency: "VND",
                order_description: "StarCi Premium monthly",
                success_url: "https://app.starci.test/pay/success",
                error_url: "https://app.starci.test/pay/error",
                cancel_url: "https://app.starci.test/pay/cancel",
            }

            expect(outcome).toEqual({
                kind: "ok",
                value: {
                    rail: "sepay",
                    orderCode: "SEPAY-1001",
                    amount: 99_000,
                    redirect: {
                        method: "POST",
                        url: "https://sandbox.pay.sepay.test/v1/checkout/init",
                        fields: { ...unsigned, signature: sepaySign(unsigned) },
                    },
                },
            })
        })

        it("refuses a checkout with a non-positive amount", () => {
            expect(sepay().createCheckout(sepayCheckoutOf({ amount: 0 }))).toEqual({
                kind: "refused",
                code: SepayErrorCode.CheckoutInvalid,
            })
        })
    })

    describe("payOS webhook confirmation", () => {
        it("proves a signed paid webhook into the shared confirmation shape", () => {
            const outcome = payos().verifyConfirmation({ body: payosWebhookOf(payosDataOf()) })

            expect(outcome).toEqual({
                kind: "ok",
                value: { rail: "payos", providerRef: "FT-1001", orderCode: 1_001, amount: 99_000 },
            })
        })

        it("refuses a forged webhook whose data was changed after it was signed", () => {
            const signed = payosWebhookOf(payosDataOf())
            const forged = { ...signed, data: payosDataOf({ amount: 1 }) }

            expect(payos().verifyConfirmation({ body: forged })).toEqual({
                kind: "refused",
                code: PayosErrorCode.SignatureInvalid,
            })
        })

        it("refuses a webhook signed under another key", () => {
            const outcome = payos().verifyConfirmation({
                body: payosWebhookOf(payosDataOf(), { signature: "0".repeat(64) }),
            })

            expect(outcome).toEqual({ kind: "refused", code: PayosErrorCode.SignatureInvalid })
        })

        it("refuses a body that is not a webhook envelope", () => {
            expect(payos().verifyConfirmation({ body: { code: "00" } })).toEqual({
                kind: "refused",
                code: PayosErrorCode.PayloadMalformed,
            })
        })

        it("refuses a validly signed webhook that does not report a paid transfer", () => {
            const outcome = payos().verifyConfirmation({ body: payosWebhookOf(payosDataOf(), { code: "01" }) })

            expect(outcome).toEqual({ kind: "refused", code: PayosErrorCode.PaymentNotConfirmed })
        })

        it("refuses a validly signed webhook whose data names no transfer", () => {
            const outcome = payos().verifyConfirmation({ body: payosWebhookOf(payosDataOf({ reference: "" })) })

            expect(outcome).toEqual({ kind: "refused", code: PayosErrorCode.PayloadMalformed })
        })
    })

    describe("rails share one confirmation shape", () => {
        it("answers the same keys whichever rail proved the payment", () => {
            const fromSepay = sepay().verifyConfirmation({ body: sepayIpnOf(), headers: { "x-secret-key": SEPAY_SECRET } })
            const fromPayos = payos().verifyConfirmation({ body: payosWebhookOf(payosDataOf()) })

            expect(fromSepay.kind).toBe("ok")
            expect(fromPayos.kind).toBe("ok")
            expect(Object.keys(fromSepay.kind === "ok" ? fromSepay.value : {}).sort()).toEqual(
                Object.keys(fromPayos.kind === "ok" ? fromPayos.value : {}).sort(),
            )
        })
    })

    describe("payOS checkout", () => {
        const linkOf = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
            paymentLinkId: "pl-1001",
            checkoutUrl: "https://pay.payos.test/web/pl-1001",
            orderCode: 1_001,
            amount: 99_000,
            ...over,
        })

        it("creates a signed payment request and trusts only a signed answer", async () => {
            const data = linkOf()
            answer = { status: 200, body: { code: "00", desc: "success", data, signature: payosSign(data) } }

            const outcome = await payos().createCheckout(payosCheckoutOf())

            expect(outcome).toEqual({
                kind: "ok",
                value: {
                    rail: "payos",
                    providerRef: "pl-1001",
                    orderCode: 1_001,
                    amount: 99_000,
                    redirect: { method: "GET", url: "https://pay.payos.test/web/pl-1001" },
                },
            })
            expect(calls).toHaveLength(1)
            expect(calls[0]?.path).toBe("/v2/payment-requests")
            expect(calls[0]?.headers["x-client-id"]).toBe("payos-client-id")
            expect(calls[0]?.headers["x-api-key"]).toBe("fake-payos-api-key")
            expect(calls[0]?.headers["x-request-id"]).toBe("corr-1001")
            expect(calls[0]?.body).toEqual({
                orderCode: 1_001,
                amount: 99_000,
                description: "StarCi Premium monthly",
                returnUrl: "https://app.starci.test/pay/return",
                cancelUrl: "https://app.starci.test/pay/cancel",
                signature: payosSign({
                    amount: 99_000,
                    cancelUrl: "https://app.starci.test/pay/cancel",
                    description: "StarCi Premium monthly",
                    orderCode: 1_001,
                    returnUrl: "https://app.starci.test/pay/return",
                }),
            })
        })

        it("refuses an answer whose data signature does not verify", async () => {
            answer = { status: 200, body: { code: "00", desc: "success", data: linkOf(), signature: "f".repeat(64) } }

            await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.SignatureInvalid,
            })
        })

        it("refuses an answer that is the link of another order", async () => {
            const data = linkOf({ orderCode: 2_002 })
            answer = { status: 200, body: { code: "00", desc: "success", data, signature: payosSign(data) } }

            await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.PayloadMalformed,
            })
        })

        it("refuses when payOS answers a refusal code", async () => {
            answer = { status: 200, body: { code: "231", desc: "order code already exists" } }

            await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.CheckoutRefused,
            })
        })

        it("refuses a success answer that carries no data or signature", async () => {
            answer = { status: 200, body: { code: "00", desc: "success" } }

            await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.PayloadMalformed,
            })
        })

        it("refuses an answer that is not a payOS envelope", async () => {
            answer = { status: 200, body: ["not", "an", "envelope"] }

            await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.PayloadMalformed,
            })
        })

        it("refuses as unavailable when the connection to payOS is cut", async () => {
            answer = { status: 0, body: null }

            await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.Unavailable,
            })
            expect(calls).toHaveLength(1)
        })

        it("calls payOS nowhere for a checkout that names no payable order", async () => {
            await expect(payos().createCheckout(payosCheckoutOf({ amount: -1 }))).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.CheckoutInvalid,
            })
            expect(calls).toEqual([])
        })
    })
})
