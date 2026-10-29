import { createHmac } from "node:crypto"
import type { DynamicModule } from "@nestjs/common"
import { builder, mock } from "@starci/jest-preset"
import { PayosErrorCode, PayosModule, PAYOS_CLIENT } from "@modules/integrations/payos"
import type { PayosClient, PayosOptions } from "@modules/integrations/payos"
import { SepayErrorCode, SepayModule, SEPAY_CLIENT } from "@modules/integrations/sepay"
import type { SepayClient, SepayOptions } from "@modules/integrations/sepay"
import { Secret } from "@modules/platform/config"
import { HTTP_CLIENT } from "@modules/platform/http"
import type { HttpClient } from "@modules/platform/http"
import { useTestWorld } from "../../world/use-test-world"

const SEPAY_SECRET = "fake-sepay-ipn-secret"
const SEPAY_SIGNING = "fake-sepay-signing-key"
const PAYOS_CHECKSUM = "fake-payos-checksum-key"

type Json = Record<string, unknown>

const sepayChannelOf = builder<SepayOptions>({
    secretKey: new Secret(SEPAY_SECRET),
    merchantId: "SP-TEST-MERCHANT",
    signingKey: new Secret(SEPAY_SIGNING),
    checkoutUrl: "https://sandbox.pay.sepay.test/v1/checkout/init",
})

const payosChannelOf = builder<PayosOptions>({
    checksumKey: new Secret(PAYOS_CHECKSUM),
    clientId: "payos-client-id",
    apiKey: new Secret("fake-payos-api-key"),
    apiBase: "https://api-merchant.payos.test",
    timeoutMs: 2000,
})

const sepayIpnOf = builder<Json>({
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

const payosDataOf = builder<Json>({
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

const linkOf = builder<Json>({
    paymentLinkId: "pl-1001",
    checkoutUrl: "https://pay.payos.test/web/pl-1001",
    orderCode: 1_001,
    amount: 99_000,
})

/** The independent signer of the payOS scheme: keys sorted, `key=value` joined by `&`, lower-case hex HMAC-SHA256. */
const payosSign = (data: Json): string =>
    createHmac("sha256", PAYOS_CHECKSUM)
        .update(
            Object.keys(data)
                .sort((a, b) => a.localeCompare(b))
                .map((key) => `${key}=${String(data[key])}`)
                .join("&"),
            "utf8",
        )
        .digest("hex")

const payosWebhookOf = (data: Json, over: Json = {}): Json => ({
    code: "00",
    desc: "success",
    success: true,
    data,
    signature: payosSign(data),
    ...over,
})

const payosAnswerOf = (data: Json): Json => ({ code: "00", desc: "success", data, signature: payosSign(data) })

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

/** The network edge of the payOS merchant API: the one double of the run, composed in place of the fetch client. */
class HttpEdgeModule {}
const edge = mock<HttpClient>()
const edgeModule = (): DynamicModule => ({
    module: HttpEdgeModule,
    providers: [{ provide: HTTP_CLIENT, useFactory: (): HttpClient => edge }],
    exports: [HTTP_CLIENT],
})

const sepayConfirmationCases = (sepay: () => SepayClient): void => {
    const headers = { "x-secret-key": SEPAY_SECRET }

    describe("SePay IPN confirmation", () => {
        it("proves a paid IPN carrying the configured secret into the shared confirmation shape", () => {
            expect(sepay().verifyConfirmation({ body: sepayIpnOf(), headers })).toEqual({
                kind: "ok",
                value: { rail: "sepay", providerRef: "sp-tx-1001", orderCode: "SEPAY-1001", amount: 99_000 },
            })
        })

        it("refuses a forged IPN whose secret key differs by one character", () => {
            const forged = { "x-secret-key": `${SEPAY_SECRET}x` }

            expect(sepay().verifyConfirmation({ body: sepayIpnOf(), headers: forged })).toEqual({
                kind: "refused",
                code: SepayErrorCode.SecretInvalid,
            })
        })

        it("refuses an IPN that carries no secret key header", () => {
            expect(sepay().verifyConfirmation({ body: sepayIpnOf(), headers: {} })).toEqual({
                kind: "refused",
                code: SepayErrorCode.SecretInvalid,
            })
        })

        it("refuses an authenticated delivery whose body is not an IPN envelope", () => {
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
            const body = sepayIpnOf({ notification_type: "TRANSACTION_VOID" })

            expect(sepay().verifyConfirmation({ body, headers })).toEqual({
                kind: "refused",
                code: SepayErrorCode.PaymentNotConfirmed,
            })
        })

        it("refuses a paid IPN whose order names no positive amount", () => {
            const body = sepayIpnOf({ order: { order_invoice_number: "SEPAY-1001", order_amount: "0" } })

            expect(sepay().verifyConfirmation({ body, headers })).toEqual({
                kind: "refused",
                code: SepayErrorCode.PayloadMalformed,
            })
        })
    })
}

const sepayCheckoutCases = (sepay: () => SepayClient): void => {
    describe("SePay checkout", () => {
        it("signs the one-time payment form with the signing key in the specified field order", () => {
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

            expect(sepay().createCheckout(sepayCheckoutOf())).toEqual({
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
}

const payosConfirmationCases = (payos: () => PayosClient): void => {
    describe("payOS webhook confirmation", () => {
        it("proves a signed paid webhook into the shared confirmation shape", () => {
            expect(payos().verifyConfirmation({ body: payosWebhookOf(payosDataOf()) })).toEqual({
                kind: "ok",
                value: { rail: "payos", providerRef: "FT-1001", orderCode: 1_001, amount: 99_000 },
            })
        })

        it("refuses a forged webhook whose data was changed after it was signed", () => {
            const forged = { ...payosWebhookOf(payosDataOf()), data: payosDataOf({ amount: 1 }) }

            expect(payos().verifyConfirmation({ body: forged })).toEqual({
                kind: "refused",
                code: PayosErrorCode.SignatureInvalid,
            })
        })

        it("refuses a webhook signed under another key", () => {
            const body = payosWebhookOf(payosDataOf(), { signature: "0".repeat(64) })

            expect(payos().verifyConfirmation({ body })).toEqual({
                kind: "refused",
                code: PayosErrorCode.SignatureInvalid,
            })
        })

        it("refuses a body that is not a webhook envelope", () => {
            expect(payos().verifyConfirmation({ body: { code: "00" } })).toEqual({
                kind: "refused",
                code: PayosErrorCode.PayloadMalformed,
            })
        })

        it("refuses a validly signed webhook that does not report a paid transfer", () => {
            const body = payosWebhookOf(payosDataOf(), { code: "01" })

            expect(payos().verifyConfirmation({ body })).toEqual({
                kind: "refused",
                code: PayosErrorCode.PaymentNotConfirmed,
            })
        })

        it("refuses a validly signed webhook whose data names no transfer", () => {
            const body = payosWebhookOf(payosDataOf({ reference: "" }))

            expect(payos().verifyConfirmation({ body })).toEqual({
                kind: "refused",
                code: PayosErrorCode.PayloadMalformed,
            })
        })
    })
}

const sharedShapeCases = (sepay: () => SepayClient, payos: () => PayosClient): void => {
    describe("rails share one confirmation shape", () => {
        it("answers the same keys whichever rail proved the payment", () => {
            const fromSepay = sepay().verifyConfirmation({
                body: sepayIpnOf(),
                headers: { "x-secret-key": SEPAY_SECRET },
            })
            const fromPayos = payos().verifyConfirmation({ body: payosWebhookOf(payosDataOf()) })
            const keysOf = (outcome: typeof fromSepay | typeof fromPayos): Array<string> =>
                Object.keys(outcome.kind === "ok" ? outcome.value : {}).sort((a, b) => a.localeCompare(b))

            expect(fromSepay.kind).toBe("ok")
            expect(fromPayos.kind).toBe("ok")
            expect(keysOf(fromSepay)).toEqual(["amount", "orderCode", "providerRef", "rail"])
            expect(keysOf(fromPayos)).toEqual(keysOf(fromSepay))
        })
    })
}

const payosCheckoutCases = (payos: () => PayosClient): void => {
    const refusedWith = async (code: PayosErrorCode): Promise<void> => {
        await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({ kind: "refused", code })
    }

    describe("payOS checkout", () => {
        it("creates a signed payment request and trusts only a signed answer", async () => {
            edge.request.mockResolvedValue({ status: 200, body: payosAnswerOf(linkOf()) })

            await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({
                kind: "ok",
                value: {
                    rail: "payos",
                    providerRef: "pl-1001",
                    orderCode: 1_001,
                    amount: 99_000,
                    redirect: { method: "GET", url: "https://pay.payos.test/web/pl-1001" },
                },
            })
            expect(edge.request.mock.calls).toEqual([
                [
                    {
                        correlationId: "corr-1001",
                        method: "POST",
                        url: "https://api-merchant.payos.test/v2/payment-requests",
                        headers: { "x-client-id": "payos-client-id", "x-api-key": "fake-payos-api-key" },
                        body: {
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
                        },
                        timeoutMs: 2000,
                    },
                ],
            ])
        })

        it("refuses an answer whose data signature does not verify", async () => {
            edge.request.mockResolvedValue({
                status: 200,
                body: { code: "00", desc: "success", data: linkOf(), signature: "f".repeat(64) },
            })

            await refusedWith(PayosErrorCode.SignatureInvalid)
        })

        it("refuses an answer that is the link of another order", async () => {
            edge.request.mockResolvedValue({ status: 200, body: payosAnswerOf(linkOf({ orderCode: 2_002 })) })

            await refusedWith(PayosErrorCode.PayloadMalformed)
        })

        it("refuses when payOS answers a refusal code", async () => {
            edge.request.mockResolvedValue({ status: 200, body: { code: "231", desc: "order code already exists" } })

            await refusedWith(PayosErrorCode.CheckoutRefused)
        })
    })
}

const payosFailureCases = (payos: () => PayosClient): void => {
    describe("payOS checkout failures", () => {
        it("refuses a success answer that carries no data or signature", async () => {
            edge.request.mockResolvedValue({ status: 200, body: { code: "00", desc: "success" } })

            await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.PayloadMalformed,
            })
        })

        it("refuses an answer that is not a payOS envelope", async () => {
            edge.request.mockResolvedValue({ status: 200, body: ["not", "an", "envelope"] })

            await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.PayloadMalformed,
            })
        })

        it("refuses as unavailable when the connection to payOS is cut", async () => {
            edge.request.mockRejectedValue(new Error("connection reset"))

            await expect(payos().createCheckout(payosCheckoutOf())).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.Unavailable,
            })
            expect(edge.request).toHaveBeenCalledTimes(1)
        })

        it("calls payOS nowhere for a checkout that names no payable order", async () => {
            await expect(payos().createCheckout(payosCheckoutOf({ amount: -1 }))).resolves.toEqual({
                kind: "refused",
                code: PayosErrorCode.CheckoutInvalid,
            })
            expect(edge.request).not.toHaveBeenCalled()
        })
    })
}

/** The real SePay and payOS clients over the local stack, with the payOS merchant API stood in at the network edge. */
describe("payment rails (integration)", () => {
    beforeEach(() => {
        edge.request.mockReset()
    })

    const world = useTestWorld({
        modules: [
            () => SepayModule.register({ channel: sepayChannelOf() }),
            () => ({ ...PayosModule.register({ channel: payosChannelOf() }), imports: [edgeModule()] }),
        ],
    })
    const sepay = (): SepayClient => world.resolve(SEPAY_CLIENT)
    const payos = (): PayosClient => world.resolve(PAYOS_CLIENT)

    sepayConfirmationCases(sepay)
    sepayCheckoutCases(sepay)
    payosConfirmationCases(payos)
    sharedShapeCases(sepay, payos)
    payosCheckoutCases(payos)
    payosFailureCases(payos)
})
