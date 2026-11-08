import { createHmac } from "node:crypto"
import { builder } from "@starci/jest-preset"
import {
    PAYOS_CLIENT,
    PayosErrorCode,
    PayosModule,
    parsePayosConfig,
    type PayosCheckout,
    type PayosClient,
} from "@modules/integrations/payos"
import { ClockModule, SystemClockService } from "@modules/platform/clock"
import { EnvSource } from "@modules/platform/config"
import { HttpModule } from "@modules/platform/http"
import { LoggingModule } from "@modules/platform/logging"
import { useSandbox } from "../../world/use-test-world"

type CheckoutAnswer = Awaited<ReturnType<PayosClient["createCheckout"]>>

/** payOS refuses a repeated order code, so the one live link of a run takes the last nine digits of the run start. */
const RUN_ORDER_CODE = Number(String(new SystemClockService().now().getTime()).slice(-9))

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

const checkoutValueOf = (answer: CheckoutAnswer): PayosCheckout | null => (answer.kind === "ok" ? answer.value : null)

const signWith = (key: string, data: Record<string, unknown>): string =>
    createHmac("sha256", key)
        .update(
            Object.keys(data)
                .sort((a, b) => a.localeCompare(b))
                .map((name) => `${name}=${String(data[name])}`)
                .join("&"),
            "utf8",
        )
        .digest("hex")

const webhookOf = (key: string) => {
    const data = webhookDataOf()
    return { code: "00", desc: "success", success: true, data, signature: signWith(key, data) }
}

/** The logger the rail takes needs the clock, so the sandbox module imports both without making either global. */
const loggingOf = () => ({ ...LoggingModule.register({}), imports: [ClockModule.register({})] })

/**
 * The real payOS client over the sandbox channel named in custody. A payment link is created but never paid, and the
 * webhook is a locally signed delivery, so no charge can happen.
 */
const sandbox = useSandbox<PayosClient>({
    provider: "payos",
    keys: ["PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY"],
    module: (values, registration) => ({
        ...PayosModule.register({ ...registration, channel: parsePayosConfig(new EnvSource(values)) }),
        imports: [loggingOf(), HttpModule.register({})],
    }),
    client: PAYOS_CLIENT,
})

sandbox.describe("payOS sandbox channel (live contract)", () => {
    it("creates a payment link whose answer signature the client verified and names the order asked for", async () => {
        const checkout = checkoutValueOf(await sandbox.client().createCheckout(checkoutOf()))

        expect(checkout?.rail).toBe("payos")
        expect(checkout?.orderCode).toBe(RUN_ORDER_CODE)
        expect(checkout?.amount).toBe(10_000)
        expect(checkout?.redirect.method).toBe("GET")
        expect(URL.canParse(checkout?.redirect.url ?? "")).toBe(true)
        expect(checkout?.providerRef).not.toBe("")
    })

    it("proves a webhook signed with the sandbox checksum key into the confirmation shape", () => {
        const outcome = sandbox.client().verifyConfirmation({ body: webhookOf(sandbox.value("PAYOS_CHECKSUM_KEY")) })

        expect(outcome).toEqual({
            kind: "ok",
            value: { rail: "payos", providerRef: "FT-LIVE-1", orderCode: 424_242, amount: 10_000 },
        })
    })

    it("refuses a webhook signed under any other key", () => {
        const outcome = sandbox.client().verifyConfirmation({
            body: webhookOf(`${sandbox.value("PAYOS_CHECKSUM_KEY")}-forged`),
        })

        expect(outcome).toEqual({ kind: "refused", code: PayosErrorCode.SignatureInvalid })
    })
})
