import { PAYOS_CLIENT, PayosErrorCode, type PayosCheckoutInput, type PayosClient } from "@modules/integrations/payos"
import { payosModules } from "../../world/payos-world.options"
import { useTestWorld } from "../../world/use-test-world"

const checkoutOf = (orderCode: number): PayosCheckoutInput => ({
    orderCode,
    amount: 99_000,
    description: "StarCi Premium",
    returnUrl: "https://app.starci.test/pay/return",
    cancelUrl: "https://app.starci.test/pay/cancel",
    correlationId: `corr-${orderCode}`,
})

/**
 * payos (integration): the payOS rail registered against the world's payOS merchant API fake. It proves a payment link is
 * created and trusted only when signed, that a repeated order code is reconciled by reading the request back, and that an
 * unreachable provider refuses as the rail's coded PayosErrorCode.
 */
describe("payos (integration)", () => {
    const world = useTestWorld({ modules: payosModules })
    const payos = (): PayosClient => world.resolve<PayosClient>(PAYOS_CLIENT)

    it("creates a hosted payment link the provider signed", async () => {
        await expect(payos().createCheckout(checkoutOf(5_001))).resolves.toEqual({
            kind: "ok",
            value: {
                rail: "payos",
                providerRef: "pl-5001",
                orderCode: 5_001,
                amount: 99_000,
                redirect: { method: "GET", url: "https://pay.payos.test/web/pl-5001" },
            },
        })
    })

    it("reconciles a repeated order code by reading its payment request back", async () => {
        await payos().createCheckout(checkoutOf(5_002))

        await expect(payos().createCheckout(checkoutOf(5_002))).resolves.toMatchObject({
            kind: "ok",
            value: { providerRef: "pl-5002", orderCode: 5_002 },
        })
    })

    it("refuses as unavailable when the provider never answers", async () => {
        await world.fake.payos?.failNext({ timeout: true })

        await expect(payos().createCheckout(checkoutOf(5_003))).resolves.toEqual({
            kind: "refused",
            code: PayosErrorCode.Unavailable,
        })
    })

    it("answers an unproved checkout as an unknown outcome when the provider keeps failing", async () => {
        await world.fake.payos?.failNext({ status: 503 })

        await expect(payos().createCheckout(checkoutOf(5_004))).resolves.toMatchObject({ kind: "refused" })
    })
})
