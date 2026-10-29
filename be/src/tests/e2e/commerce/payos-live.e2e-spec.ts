import { createHmac } from "node:crypto"
import { builder } from "@starci/jest-preset"
import { PAYOS_CLIENT, PayosErrorCode, PayosModule, parsePayosConfig } from "@modules/integrations/payos"
import type { PayosClient } from "@modules/integrations/payos"
import { ClockModule } from "@modules/platform/clock"
import { EnvSource } from "@modules/platform/config"
import { HttpModule } from "@modules/platform/http"
import { LoggingModule } from "@modules/platform/logging"
import { useSandbox } from "../../world/use-test-world"

/** payOS refuses a repeated order code, so the one live link of a run takes the last nine digits of the run's start. */
const RUN_ORDER_CODE = Number(String(Date.now()).slice(-9))

const checkoutOf = builder({
    orderCode: RUN_ORDER_CODE,
    amount: 10_000,
    description: "StarCi live check",
    returnUrl: "https://app.starci.test/pay/return",
    cancelUrl: "https://app.starci.test/pay/cancel",
    correlationId: "starci-live-contract",
})

const webhookDataOf = builder<Record<string, unknown>>({
    amount: 10_000,
    description: "StarCi live check",
    orderCode: 424_242,
    reference: "FT-LIVE-1",
})

const signWith = (key: string, data: Record<string, unknown>): string =>
    createHmac("sha256", key)
        .update(
            Object.keys(data)
                .sort()
                .map((name) => `${name}=${String(data[name])}`)
                .join("&"),
            "utf8",
        )
        .digest("hex")

/**
 * The real payOS client over the sandbox channel named in custody. A payment link is created but never paid, and the
 * webhook is a locally signed delivery, so no charge can happen.
 */
const sandbox = useSandbox<PayosClient>({
    provider: "payos",
    keys: ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY"],
    module: (values, registration) => ({
        ...PayosModule.register({ ...registration, channel: parsePayosConfig(new EnvSource(values)) }),
        imports: [
            ClockModule.register({ isGlobal: true }),
            LoggingModule.register({ isGlobal: true }),
            HttpModule.register({}),
        ],
    }),
    client: PAYOS_CLIENT,
})

sandbox.describe("payOS sandbox channel (live contract)", () => {
    it("creates a payment link whose answer signature the client verified and names the order asked for", async () => {
        const outcome = await sandbox.client().createCheckout(checkoutOf())

        expect(outcome.kind).toBe("ok")
        if (outcome.kind !== "ok") return
        expect(outcome.value.rail).toBe("payos")
        expect(outcome.value.orderCode).toBe(RUN_ORDER_CODE)
        expect(outcome.value.amount).toBe(10_000)
        expect(outcome.value.redirect.method).toBe("GET")
        expect(URL.canParse(outcome.value.redirect.url)).toBe(true)
        expect(outcome.value.providerRef).not.toBe("")
    })

    it("proves a webhook signed with the sandbox checksum key into the confirmation shape", () => {
        const data = webhookDataOf()
        const outcome = sandbox.client().verifyConfirmation({
            body: {
                code: "00",
                desc: "success",
                success: true,
                data,
                signature: signWith(sandbox.value("PAYOS_CHECKSUM_KEY"), data),
            },
        })

        expect(outcome).toEqual({
            kind: "ok",
            value: { rail: "payos", providerRef: "FT-LIVE-1", orderCode: 424_242, amount: 10_000 },
        })
    })

    it("refuses a webhook signed under any other key", () => {
        const data = webhookDataOf()
        const outcome = sandbox.client().verifyConfirmation({
            body: {
                code: "00",
                desc: "success",
                success: true,
                data,
                signature: signWith(`${sandbox.value("PAYOS_CHECKSUM_KEY")}-forged`, data),
            },
        })

        expect(outcome).toEqual({ kind: "refused", code: PayosErrorCode.SignatureInvalid })
    })
})
