import { PremiumReadService, PurchaseService } from "@modules/domain/purchase"
import { sql } from "@modules/platform/database"
import { MONTHLY, sepayBody } from "../../fixtures/builders/premium.builder"
import { RETURN_BASE, SEPAY_SECRET, premiumWorldModule } from "../../world/premium-world.options"
import { useTestWorld } from "../../world/use-test-world"

const LEARNER = "30000000-0000-4000-8000-00000000000c"

const PURCHASE_ROWS = sql`SELECT plan, amount_vnd, status FROM purchases WHERE learner_id = $1::uuid`

/**
 * The Premium checkout start over the real local stack: the price is the server offer however the caller names the
 * plan, a name no offer or rail carries creates nothing, and the provider returns to the server's own address.
 */
describe("premium checkout (integration)", () => {
    const world = useTestWorld({ modules: [premiumWorldModule] })
    const purchases = (): PurchaseService => world.resolve(PurchaseService)
    const rowsOf = async (): Promise<Array<{ plan: string; amount_vnd: number; status: string }>> =>
        (await world.db.primary?.query(PURCHASE_ROWS, [LEARNER])) ?? []

    it("commerce/amount-from-server: the order carries the server price and an underpaid delivery settles nothing", async () => {
        const monthly = await purchases().createCheckout({ learnerId: LEARNER, plan: "monthly", rail: "sepay" })

        expect(monthly.purchase.amountVnd).toBe(MONTHLY)
        expect(monthly.redirect.fields).toContainEqual({ name: "order_amount", value: String(MONTHLY) })
        expect(await rowsOf()).toEqual([{ plan: "monthly", amount_vnd: MONTHLY, status: "pending" }])

        await expect(
            purchases().recordSepayDelivery({
                rawBody: sepayBody(monthly.purchase.orderCode, 1, "tx-underpaid"),
                secretKey: SEPAY_SECRET,
            }),
        ).resolves.toEqual({ outcome: "refused", reason: "amount-mismatch" })
        await expect(
            world.resolve(PremiumReadService).premiumOrder(LEARNER, monthly.purchase.purchaseId),
        ).resolves.toMatchObject({ status: "verifying", amountVnd: MONTHLY })
    })

    it("commerce/unknown-names-create-nothing: a plan or rail no offer carries is refused before any order exists", async () => {
        const before = (await rowsOf()).length

        await expect(
            purchases().createCheckout({ learnerId: LEARNER, plan: "monthly-for-1-vnd", rail: "sepay" }),
        ).rejects.toMatchObject({ code: "PURCHASE_PLAN_UNKNOWN" })
        await expect(
            purchases().createCheckout({ learnerId: LEARNER, plan: "monthly", rail: "paypal" }),
        ).rejects.toMatchObject({ code: "PURCHASE_RAIL_UNKNOWN" })

        expect(await rowsOf()).toHaveLength(before)
    })

    it("commerce/return-urls-are-the-servers: the provider returns to the configured web origin and the order id", async () => {
        const checkout = await purchases().createCheckout({ learnerId: LEARNER, plan: "monthly", rail: "sepay" })
        const orderId = checkout.purchase.purchaseId
        const urlOf = (result: string): string => `${RETURN_BASE}/premium/result?order=${orderId}&result=${result}`

        expect(checkout.redirect.fields).toEqual(
            expect.arrayContaining([
                { name: "success_url", value: urlOf("success") },
                { name: "error_url", value: urlOf("error") },
                { name: "cancel_url", value: urlOf("cancel") },
            ]),
        )
    })
})
