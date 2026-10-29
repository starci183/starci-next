import { createHmac } from "node:crypto"
import { builder } from "@starci/jest-preset"
import { SEPAY_CLIENT, SepayErrorCode, SepayModule, parseSepayConfig } from "@modules/integrations/sepay"
import type { SepayClient } from "@modules/integrations/sepay"
import { ClockModule } from "@modules/platform/clock"
import { EnvSource } from "@modules/platform/config"
import { LoggingModule } from "@modules/platform/logging"
import { useSandbox } from "../../world/use-test-world"

const checkoutOf = builder({
    orderCode: "STARCI-LIVE-CHECK-1",
    amount: 10_000,
    description: "StarCi live contract check",
    successUrl: "https://app.starci.test/pay/success",
    errorUrl: "https://app.starci.test/pay/error",
    cancelUrl: "https://app.starci.test/pay/cancel",
})

const ipnOf = builder<Record<string, unknown>>({
    timestamp: 1_790_000_000,
    notification_type: "ORDER_PAID",
    order: { order_invoice_number: "STARCI-LIVE-CHECK-1", order_amount: "10000.00" },
    transaction: { transaction_id: "live-contract-tx-1" },
    customer: {},
})

/**
 * The real SePay client over the sandbox channel named in custody. Nothing here pays: the checkout form is built and signed
 * but never submitted to SePay, and the IPN is a locally built delivery, so no charge can happen.
 */
const sandbox = useSandbox<SepayClient>({
    provider: "sepay",
    keys: ["SEPAY_IPN_SECRET_KEY", "SEPAY_MERCHANT_ID", "SEPAY_SIGNING_SECRET_KEY", "SEPAY_CHECKOUT_URL"],
    module: (values, registration) => ({
        ...SepayModule.register({ ...registration, channel: parseSepayConfig(new EnvSource(values)) }),
        imports: [ClockModule.register({ isGlobal: true }), LoggingModule.register({ isGlobal: true })],
    }),
    client: SEPAY_CLIENT,
})

sandbox.describe("SePay sandbox channel (live contract)", () => {
    it("signs a one-time payment form the sandbox signing secret verifies, without submitting it", () => {
        const outcome = sandbox.client().createCheckout(checkoutOf())

        expect(outcome.kind).toBe("ok")
        if (outcome.kind !== "ok") return
        const { signature, ...fields } = outcome.value.redirect.fields
        const expected = createHmac("sha256", sandbox.value("SEPAY_SIGNING_SECRET_KEY"))
            .update(
                Object.entries(fields)
                    .map(([name, value]) => `${name}=${value}`)
                    .join(","),
                "utf8",
            )
            .digest("base64")

        expect(outcome.value.redirect.method).toBe("POST")
        expect(outcome.value.redirect.url).toBe(sandbox.value("SEPAY_CHECKOUT_URL"))
        expect(fields.merchant).toBe(sandbox.value("SEPAY_MERCHANT_ID"))
        expect(fields.order_invoice_number).toBe("STARCI-LIVE-CHECK-1")
        expect(fields.order_amount).toBe("10000")
        expect(signature).toBe(expected)
    })

    it("proves an IPN that carries the sandbox IPN secret into the confirmation shape", () => {
        const outcome = sandbox.client().verifyConfirmation({
            body: ipnOf(),
            headers: { "x-secret-key": sandbox.value("SEPAY_IPN_SECRET_KEY") },
        })

        expect(outcome).toEqual({
            kind: "ok",
            value: { rail: "sepay", providerRef: "live-contract-tx-1", orderCode: "STARCI-LIVE-CHECK-1", amount: 10_000 },
        })
    })

    it("refuses an IPN that carries any other secret", () => {
        const outcome = sandbox.client().verifyConfirmation({
            body: ipnOf(),
            headers: { "x-secret-key": `${sandbox.value("SEPAY_IPN_SECRET_KEY")}-forged` },
        })

        expect(outcome).toEqual({ kind: "refused", code: SepayErrorCode.SecretInvalid })
    })
})
