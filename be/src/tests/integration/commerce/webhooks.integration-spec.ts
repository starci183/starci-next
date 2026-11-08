import { PurchaseService } from "@modules/domain/purchase"
import { WEBHOOK_DOORS, WEBHOOK_FORGED_KEY } from "../../fixtures/builders/webhook.builder"
import { commerceLedgerOf } from "../../fixtures/builders/commerce-ledger.builder"
import { premiumWorldModule } from "../../world/premium-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * The provider webhook intakes over the real local stack: Premium is granted only by a delivery whose proof verifies,
 * and exactly once however often the provider delivers it.
 */
describe("provider webhooks (integration)", () => {
    const world = useTestWorld({ modules: [premiumWorldModule] })
    const purchases = (): PurchaseService => world.resolve(PurchaseService)
    const ledger = commerceLedgerOf(() => world.db.primary, 2)

    describe.each(WEBHOOK_DOORS)("$rail", ({ rail, genuineKey, deliver }) => {
        it("webhooks/bad-signature-is-refused: a delivery that fails its proof is refused and grants nothing", async () => {
            const { learnerId, orderCode } = await ledger.pendingOn(rail)

            await expect(
                deliver(purchases(), { orderCode, reference: "ref-forged", signedWith: WEBHOOK_FORGED_KEY }),
            ).rejects.toMatchObject({ code: "PURCHASE_CONFIRMATION_REFUSED" })

            expect(await ledger.purchaseOf(rail, orderCode)).toEqual([{ status: "pending", provider_ref: null }])
            expect(await ledger.eventsOf(rail, orderCode)).toEqual([])
            expect(await ledger.premiumOf(learnerId)).toBeNull()
        })

        it("webhooks/accepted-delivery-publishes-once: a verified delivery settles the purchase and grants Premium once", async () => {
            const { learnerId, orderCode } = await ledger.pendingOn(rail)

            await deliver(purchases(), { orderCode, reference: "ref-paid", signedWith: genuineKey })

            expect(await ledger.purchaseOf(rail, orderCode)).toEqual([{ status: "paid", provider_ref: "ref-paid" }])
            expect(await ledger.eventsOf(rail, orderCode)).toEqual(["paid"])
            expect(await ledger.premiumOf(learnerId)).not.toBeNull()
        })

        it("webhooks/replay-is-refused: a replayed delivery changes nothing and a second payment of a paid order is recorded as refused", async () => {
            const { learnerId, orderCode } = await ledger.pendingOn(rail)
            await deliver(purchases(), { orderCode, reference: "ref-first", signedWith: genuineKey })
            const granted = await ledger.premiumOf(learnerId)

            await expect(
                deliver(purchases(), { orderCode, reference: "ref-first", signedWith: genuineKey }),
            ).resolves.toEqual({ outcome: "duplicate" })
            await expect(
                deliver(purchases(), { orderCode, reference: "ref-other", signedWith: genuineKey }),
            ).resolves.toEqual({ outcome: "refused", reason: "already-paid" })

            expect(await ledger.eventsOf(rail, orderCode)).toEqual(["paid", "confirmation-refused"])
            expect(await ledger.purchaseOf(rail, orderCode)).toEqual([{ status: "paid", provider_ref: "ref-first" }])
            expect(await ledger.premiumOf(learnerId)).toBe(granted)
        })
    })
})
