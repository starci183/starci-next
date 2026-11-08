import { EntitlementService } from "@modules/domain/entitlement"
import { PurchaseService } from "@modules/domain/purchase"
import {
    WEBHOOK_AMOUNT,
    WEBHOOK_DOORS,
    WEBHOOK_SEPAY_SECRET,
    sepayIpnOf,
    type SepayIpnFacts,
} from "../../fixtures/builders/webhook.builder"
import { commerceLedgerOf } from "../../fixtures/builders/commerce-ledger.builder"
import { premiumWorldModule } from "../../world/premium-world.options"
import { useTestWorld } from "../../world/use-test-world"

const INJECTED = "injected failure between settlement and grant"

/** Posts one SePay IPN with the facts a case names, under the genuine IPN secret key. */
const sepayDelivery = (purchases: PurchaseService, facts: SepayIpnFacts): Promise<unknown> =>
    purchases.recordSepayDelivery({
        rawBody: Buffer.from(JSON.stringify(sepayIpnOf(facts))),
        secretKey: WEBHOOK_SEPAY_SECRET,
    })

/**
 * The settlement of verified provider deliveries over the real local stack: the paid mark and the grant commit together,
 * and a verified delivery that cannot be applied is recorded once and grants nothing.
 */
describe("provider webhook settlement (integration)", () => {
    const world = useTestWorld({ modules: [premiumWorldModule] })
    const purchases = (): PurchaseService => world.resolve(PurchaseService)
    const ledger = commerceLedgerOf(() => world.db.primary, 3)

    describe.each(WEBHOOK_DOORS)("$rail", ({ rail, genuineKey, deliver }) => {
        it("webhooks/grant-commits-with-settlement: a failure between the paid mark and the grant leaves nothing, and the retry settles", async () => {
            const { learnerId, orderCode } = await ledger.pendingOn(rail)
            const delivery = { orderCode, reference: "ref-retried", signedWith: genuineKey }
            const grant = jest
                .spyOn(world.resolve(EntitlementService), "grantWith")
                .mockRejectedValueOnce(new Error(INJECTED))

            await expect(deliver(purchases(), delivery)).rejects.toThrow(INJECTED)

            expect(await ledger.purchaseOf(rail, orderCode)).toEqual([{ status: "pending", provider_ref: null }])
            expect(await ledger.eventsOf(rail, orderCode)).toEqual([])
            expect(await ledger.premiumOf(learnerId)).toBeNull()

            await expect(deliver(purchases(), delivery)).resolves.toMatchObject({ outcome: "granted" })

            expect(await ledger.purchaseOf(rail, orderCode)).toEqual([{ status: "paid", provider_ref: "ref-retried" }])
            expect(await ledger.eventsOf(rail, orderCode)).toEqual(["paid"])
            expect(await ledger.premiumOf(learnerId)).not.toBeNull()
            grant.mockRestore()
        })

        it("webhooks/unknown-order-is-recorded: a verified delivery for an order never persisted is recorded once and grants nothing", async () => {
            const orderCode = rail === "sepay" ? "SE-UNKNOWN-1" : "999001"
            const delivery = { orderCode, reference: "ref-orphan", signedWith: genuineKey }

            await expect(deliver(purchases(), delivery)).resolves.toEqual({
                outcome: "refused",
                reason: "order-unknown",
            })
            await deliver(purchases(), delivery)

            expect(await ledger.refusalsOf(rail, orderCode)).toEqual([
                {
                    kind: "confirmation-refused",
                    reason: "order-unknown",
                    orphan: true,
                    amount_vnd: WEBHOOK_AMOUNT,
                    currency: "VND",
                },
            ])
        })
    })
})

/** SePay's payment state over the real local stack: a void, a payment not approved or not in VND settles nothing. */
describe("sepay webhook payment state (integration)", () => {
    const world = useTestWorld({ modules: [premiumWorldModule] })
    const purchases = (): PurchaseService => world.resolve(PurchaseService)
    const ledger = commerceLedgerOf(() => world.db.primary, 4)

    const deliverSepay = (facts: SepayIpnFacts): Promise<unknown> => sepayDelivery(purchases(), facts)

    it("webhooks/sepay-void-is-recorded: a TRANSACTION_VOID is recorded as payment-voided and never grants", async () => {
        const { learnerId, orderCode } = await ledger.pendingOn("sepay")

        await expect(
            deliverSepay({ orderCode, reference: "ref-void", notificationType: "TRANSACTION_VOID" }),
        ).resolves.toEqual({ outcome: "refused", reason: "voided" })

        expect(await ledger.purchaseOf("sepay", orderCode)).toEqual([{ status: "pending", provider_ref: null }])
        expect(await ledger.eventsOf("sepay", orderCode)).toEqual(["payment-voided"])
        expect(await ledger.premiumOf(learnerId)).toBeNull()
    })

    it("webhooks/sepay-unpaid-or-foreign-currency-is-refused: a payment not approved or not in VND settles nothing", async () => {
        const { learnerId, orderCode } = await ledger.pendingOn("sepay")

        await expect(deliverSepay({ orderCode, reference: "ref-state", transactionStatus: "FAILED" })).resolves.toEqual(
            { outcome: "refused", reason: "not-paid" },
        )
        await expect(deliverSepay({ orderCode, reference: "ref-state", currency: "USD" })).resolves.toEqual({
            outcome: "refused",
            reason: "currency-mismatch",
        })

        expect(await ledger.purchaseOf("sepay", orderCode)).toEqual([{ status: "pending", provider_ref: null }])
        expect(await ledger.eventsOf("sepay", orderCode)).toEqual(["confirmation-refused", "confirmation-refused"])
        expect(await ledger.premiumOf(learnerId)).toBeNull()
    })
})
