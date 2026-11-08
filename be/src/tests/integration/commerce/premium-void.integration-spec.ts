import { EntitlementService } from "@modules/domain/entitlement"
import { PurchaseService } from "@modules/domain/purchase"
import { sql } from "@modules/platform/database"
import { WEBHOOK_SEPAY_SECRET, sepayIpnOf, type SepayIpnFacts } from "../../fixtures/builders/webhook.builder"
import { commerceLedgerOf } from "../../fixtures/builders/commerce-ledger.builder"
import { premiumWorldModule } from "../../world/premium-world.options"
import { useTestWorld } from "../../world/use-test-world"

const REVOKED_NOTICES = sql`SELECT count(*)::int AS n FROM notifications WHERE learner_id = $1::uuid AND kind = 'premium.revoked'`

/** A learner no purchase belongs to, who receives only the grant a case compares against. */
const REFERENCE_LEARNER = "50000000-0000-4000-8000-000000000001"

/** Posts one SePay IPN with the facts a case names, under the genuine IPN secret key. */
const sepayDelivery = (purchases: PurchaseService, facts: SepayIpnFacts): Promise<unknown> =>
    purchases.recordSepayDelivery({
        rawBody: Buffer.from(JSON.stringify(sepayIpnOf(facts))),
        secretKey: WEBHOOK_SEPAY_SECRET,
    })

/**
 * Q-W2-VOID over the real local stack: a verified SePay TRANSACTION_VOID of a paid order takes back exactly the Premium
 * time that order added, shifts a later purchase's extension back by it, tells the learner once, and changes nothing more
 * when SePay repeats it.
 */
describe("premium void (integration)", () => {
    const world = useTestWorld({ modules: [premiumWorldModule] })
    const purchases = (): PurchaseService => world.resolve(PurchaseService)
    const ledger = commerceLedgerOf(() => world.db.primary, 6)
    const noticesOf = async (learnerId: string): Promise<number> => {
        const rows: Array<{ n: number }> = (await world.db.primary?.query(REVOKED_NOTICES, [learnerId])) ?? []
        return rows[0]?.n ?? -1
    }

    it("commerce/void-revokes-its-own-term: voiding the first of two paid orders leaves exactly the second order's term", async () => {
        const first = await ledger.pendingOn("sepay")
        const second = await ledger.pendingFor("sepay", first.learnerId)
        await sepayDelivery(purchases(), { orderCode: first.orderCode, reference: "ref-first" })
        await sepayDelivery(purchases(), { orderCode: second.orderCode, reference: "ref-second" })
        const confirmedSecond = await ledger.confirmedAtOf("sepay", second.orderCode)
        const onlySecond = await world
            .resolve(EntitlementService)
            .grant({ learnerId: REFERENCE_LEARNER, term: "monthly", confirmedAt: confirmedSecond ?? new Date(0) })

        await expect(
            sepayDelivery(purchases(), {
                orderCode: first.orderCode,
                reference: "ref-first",
                notificationType: "TRANSACTION_VOID",
            }),
        ).resolves.toMatchObject({ outcome: "revoked", entitlement: { premiumUntil: onlySecond.premiumUntil } })

        expect(await ledger.purchaseOf("sepay", first.orderCode)).toEqual([
            { status: "voided", provider_ref: "ref-first" },
        ])
        expect(await ledger.purchaseOf("sepay", second.orderCode)).toEqual([
            { status: "paid", provider_ref: "ref-second" },
        ])
        expect(await ledger.eventsOf("sepay", first.orderCode)).toEqual(["paid", "payment-voided", "premium-revoked"])
        expect(await ledger.premiumOf(first.learnerId)).toBe(onlySecond.premiumUntil)
        expect(await noticesOf(first.learnerId)).toBe(1)
    })

    it("commerce/void-is-idempotent: a repeated void, or a void of the only order, never revokes twice", async () => {
        const { learnerId, orderCode } = await ledger.pendingOn("sepay")
        await sepayDelivery(purchases(), { orderCode, reference: "ref-only" })
        const granted = await ledger.premiumOf(learnerId)
        const voidOf = { orderCode, reference: "ref-only", notificationType: "TRANSACTION_VOID" }

        await expect(sepayDelivery(purchases(), voidOf)).resolves.toMatchObject({ outcome: "revoked" })
        const ended = await ledger.premiumOf(learnerId)
        await expect(sepayDelivery(purchases(), voidOf)).resolves.toEqual({ outcome: "refused", reason: "voided" })

        expect(ended).not.toBeNull()
        expect(new Date(ended ?? 0).getTime()).toBeLessThan(new Date(granted ?? 0).getTime())
        expect(await ledger.premiumOf(learnerId)).toBe(ended)
        expect(await ledger.eventsOf("sepay", orderCode)).toEqual(["paid", "payment-voided", "premium-revoked"])
        expect(await noticesOf(learnerId)).toBe(1)
    })
})
