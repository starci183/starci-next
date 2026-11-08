import { PremiumReadService, PurchaseService } from "@modules/domain/purchase"
import { FORGED_KEY, YEARLY, sepayBody } from "../../fixtures/builders/premium.builder"
import { SEPAY_SECRET, premiumWorldModule } from "../../world/premium-world.options"
import { useTestWorld } from "../../world/use-test-world"

const LEARNER_A = "30000000-0000-4000-8000-00000000000a"
const LEARNER_B = "30000000-0000-4000-8000-00000000000b"
const UNKNOWN_ORDER = "30000000-0000-4000-8000-0000000000ff"

/**
 * The Premium order reads over the real local stack: a learner reads only their own orders, and an order stays
 * verifying until a verified provider delivery settles it.
 */
describe("premium orders (integration)", () => {
    const world = useTestWorld({ modules: [premiumWorldModule] })
    const purchases = (): PurchaseService => world.resolve(PurchaseService)
    const reads = (): PremiumReadService => world.resolve(PremiumReadService)

    it("commerce/own-orders-only: a learner reads their own order and another learner's order is not found", async () => {
        const checkout = await purchases().createCheckout({ learnerId: LEARNER_A, plan: "monthly", rail: "sepay" })
        const orderId = checkout.purchase.purchaseId

        await expect(reads().premiumOrder(LEARNER_A, orderId)).resolves.toMatchObject({ orderId, status: "verifying" })
        await expect(reads().premiumOrder(LEARNER_B, orderId)).rejects.toMatchObject({
            code: "PURCHASE_ORDER_NOT_FOUND",
        })
        await expect(reads().premiumOrder(LEARNER_B, UNKNOWN_ORDER)).rejects.toMatchObject({
            code: "PURCHASE_ORDER_NOT_FOUND",
        })
    })

    it("commerce/verifying-until-webhook: an order stays verifying until a verified delivery settles it", async () => {
        const checkout = await purchases().createCheckout({ learnerId: LEARNER_A, plan: "yearly", rail: "sepay" })
        const orderId = checkout.purchase.purchaseId
        const { orderCode } = checkout.purchase

        await expect(reads().premiumOrder(LEARNER_A, orderId)).resolves.toMatchObject({
            status: "verifying",
            premiumUntil: null,
        })
        await expect(reads().premiumStatus(LEARNER_A)).resolves.toMatchObject({ lastRail: "sepay" })

        await expect(
            purchases().recordSepayDelivery({
                rawBody: sepayBody(orderCode, YEARLY, "tx-forged"),
                secretKey: FORGED_KEY,
            }),
        ).rejects.toMatchObject({ code: "PURCHASE_CONFIRMATION_REFUSED" })
        await expect(reads().premiumOrder(LEARNER_A, orderId)).resolves.toMatchObject({ status: "verifying" })

        await purchases().recordSepayDelivery({
            rawBody: sepayBody(orderCode, YEARLY, "tx-genuine"),
            secretKey: SEPAY_SECRET,
        })

        const settled = await reads().premiumOrder(LEARNER_A, orderId)
        expect(settled.status).toBe("active")
        expect(settled.premiumUntil).not.toBeNull()
        await expect(reads().premiumStatus(LEARNER_A)).resolves.toMatchObject({
            isPremium: true,
            premiumUntil: settled.premiumUntil,
        })
    })
})
