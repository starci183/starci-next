import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction, MockOf } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { ENTITLEMENT_SERVICE } from "@modules/domain/entitlement"
import type { Entitlement, EntitlementService } from "@modules/domain/entitlement"
import { NOTIFICATION_PRODUCER, type NotificationProducerPort } from "@modules/domain/notification"
import type { SepayConfirmation } from "@modules/integrations/sepay"
import {
    PURCHASE_EXPIRED_AT as EXPIRED_AT,
    PURCHASE_ID,
    PURCHASE_LATER as LATER,
    PURCHASE_LEARNER as LEARNER_ID,
    PURCHASE_NOW as NOW,
    paidPurchaseRowOf as paidRow,
    purchaseRowOf as purchaseRow,
    sepayConfirmationOf as sepayConfirmation,
    type PurchaseRowShape,
} from "@tests/fixtures/builders/purchase.builder"
import { PurchaseErrorCode } from "./errors/purchase.error"
import { PurchaseSettlementService } from "./purchase-settlement.service"
import {
    INSERT_CONFIRMATION_REFUSAL,
    INSERT_PURCHASE_EVENT,
    LOCK_LEARNER_PREMIUM,
    LOCK_PURCHASE_BY_ORDER,
    MARK_PAID,
    MARK_VOIDED,
    SELECT_STANDING_GRANTS,
} from "./persistence/purchase.sql"

const granted: Entitlement = { learnerId: LEARNER_ID, premiumUntil: LATER, updatedAt: NOW }

const auditEvent = (tx: FakeTransaction, type: string, rail: string, ref: string | null = "tx-1"): void => {
    expect(tx.em.query).toHaveBeenCalledWith(INSERT_PURCHASE_EVENT, [PURCHASE_ID, type, rail, ref, new Date(NOW)])
}

/** Asserts the one refusal row a verified-but-unapplied sepay delivery records, with the facts it reported. */
const refusal = (
    tx: FakeTransaction,
    purchaseId: string | null,
    kind: string,
    reason: string,
    reported: Partial<SepayConfirmation> = {},
): void => {
    const { providerRef, orderCode, amount, currency } = sepayConfirmation(reported)
    expect(tx.em.query).toHaveBeenCalledWith(INSERT_CONFIRMATION_REFUSAL, [
        purchaseId,
        kind,
        "sepay",
        providerRef,
        orderCode,
        Number.isSafeInteger(amount) ? amount : null,
        currency,
        reason,
        new Date(NOW),
    ])
}

interface World {
    readonly service: PurchaseSettlementService
    readonly entitlement: MockOf<EntitlementService>
    readonly notifications: MockOf<NotificationProducerPort>
    readonly tx: FakeTransaction
}

const world = async (stubs: { readonly query?: ReadonlyArray<readonly [string, unknown]> } = {}): Promise<World> => {
    const tx = fakeTransaction(mockEntityManager({ query: [...(stubs.query ?? [])] }))
    const entitlement = mock<EntitlementService>()
    const notifications = mock<NotificationProducerPort>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            PurchaseSettlementService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: NOTIFICATION_PRODUCER, useValue: notifications },
        ],
    }).compile()
    return { service: moduleRef.get(PurchaseSettlementService), entitlement, notifications, tx }
}

const settled = (row: PurchaseRowShape): Array<readonly [string, unknown]> => [
    [LOCK_PURCHASE_BY_ORDER, [row]],
    [LOCK_LEARNER_PREMIUM, [{ locked: "" }]],
    [MARK_PAID, [paidRow()]],
    [INSERT_PURCHASE_EVENT, []],
]

/** The queries of a delivery whose order was never persisted: an empty lock and the refusal row. */
const unknownOrder: ReadonlyArray<readonly [string, unknown]> = [
    [LOCK_PURCHASE_BY_ORDER, []],
    [INSERT_CONFIRMATION_REFUSAL, []],
]

/** The queries of a delivery refused against the locked row. */
const refusedFor = (row: PurchaseRowShape): Array<readonly [string, unknown]> => [
    [LOCK_PURCHASE_BY_ORDER, [row]],
    [INSERT_CONFIRMATION_REFUSAL, []],
]

describe("PurchaseSettlementService refusals", () => {
    it("records a confirmation naming an order never persisted as refused, without a purchase or a grant", async () => {
        const { service, entitlement, tx } = await world({ query: [...unknownOrder] })
        const confirmed = sepayConfirmation()

        await expect(service.apply(confirmed)).resolves.toEqual({
            outcome: "refused",
            reason: "order-unknown",
        })

        expect(tx.em.query).toHaveBeenCalledWith(LOCK_PURCHASE_BY_ORDER, ["sepay", "SE-7"])
        refusal(tx, null, "confirmation-refused", "order-unknown")
        expect(tx.commits).toBe(1)
        expect(entitlement.grantWith).not.toHaveBeenCalled()
    })

    it("records a second payment of a paid order under another provider reference as refused", async () => {
        const { service, entitlement, notifications, tx } = await world({ query: refusedFor(paidRow()) })
        const confirmed = sepayConfirmation({ providerRef: "tx-2" })

        await expect(service.apply(confirmed)).resolves.toEqual({
            outcome: "refused",
            reason: "already-paid",
        })

        refusal(tx, PURCHASE_ID, "confirmation-refused", "already-paid", { providerRef: "tx-2" })
        expect(notifications.notify).not.toHaveBeenCalled()
        expect(tx.em.query).not.toHaveBeenCalledWith(MARK_PAID, expect.any(Array))
        expect(entitlement.grantWith).not.toHaveBeenCalled()
    })

    it.each<[string, Partial<PurchaseRowShape>, Partial<SepayConfirmation>, string]>([
        ["a failed purchase", { status: "failed" }, {}, "not-payable"],
        ["another amount", {}, { amount: 99_000 }, "amount-mismatch"],
        ["a fractional amount", {}, { amount: 229_000.5 }, "amount-mismatch"],
        ["another reported currency", {}, { currency: "USD" }, "currency-mismatch"],
        ["no reported currency", {}, { currency: "" }, "currency-mismatch"],
        ["a purchase in another currency", { currency: "USD" }, {}, "currency-mismatch"],
        ["a payment not reported paid", {}, { state: "unpaid" }, "not-paid"],
    ])("records a confirmation for %s as refused, without a grant", async (_case, row, confirmation, reason) => {
        const { service, entitlement, tx } = await world({ query: refusedFor(purchaseRow(row)) })
        const confirmed = sepayConfirmation(confirmation)

        await expect(service.apply(confirmed)).resolves.toEqual({ outcome: "refused", reason })

        refusal(tx, PURCHASE_ID, "confirmation-refused", reason, confirmation)
        expect(tx.em.query).not.toHaveBeenCalledWith(MARK_PAID, expect.any(Array))
        expect(entitlement.grantWith).not.toHaveBeenCalled()
    })
})

describe("PurchaseSettlementService voids and failed writes", () => {
    it("only records a void of an order that was never paid, or is unknown, as payment-voided", async () => {
        const known = await world({ query: refusedFor(purchaseRow()) })
        const knownConfirmed = sepayConfirmation({ state: "voided" })

        await expect(known.service.apply(knownConfirmed)).resolves.toEqual({
            outcome: "refused",
            reason: "voided",
        })
        refusal(known.tx, PURCHASE_ID, "payment-voided", "voided")

        const unknown = await world({ query: [...unknownOrder] })
        const unknownConfirmed = sepayConfirmation({ state: "voided" })

        await unknown.service.apply(unknownConfirmed)
        refusal(unknown.tx, null, "payment-voided", "voided")
        expect(known.entitlement.grantWith).not.toHaveBeenCalled()
        expect(unknown.entitlement.grantWith).not.toHaveBeenCalled()
    })

    it("records a repeated void of a voided order once more as payment-voided and revokes nothing again", async () => {
        const { service, entitlement, notifications, tx } = await world({
            query: refusedFor(purchaseRow({ status: "voided", provider_ref: "tx-1", confirmed_at: new Date(NOW) })),
        })

        await expect(service.apply(sepayConfirmation({ state: "voided" }))).resolves.toEqual({
            outcome: "refused",
            reason: "voided",
        })
        refusal(tx, PURCHASE_ID, "payment-voided", "voided")
        expect(entitlement.rebuildWith).not.toHaveBeenCalled()
        expect(notifications.notify).not.toHaveBeenCalled()
    })

    it("rolls the whole settlement back when the paid write comes back empty", async () => {
        const query: Array<readonly [string, unknown]> = [
            [LOCK_PURCHASE_BY_ORDER, [purchaseRow()]],
            [LOCK_LEARNER_PREMIUM, [{ locked: "" }]],
            [MARK_PAID, []],
        ]
        const { service, entitlement, tx } = await world({ query })
        const confirmed = sepayConfirmation()

        await expect(service.apply(confirmed)).rejects.toMatchObject({
            code: PurchaseErrorCode.PurchaseMissing,
        })
        expect(tx.rollbacks).toBe(1)
        expect(entitlement.grantWith).not.toHaveBeenCalled()
    })
})

describe("PurchaseSettlementService applies", () => {
    it("marks a pending purchase paid, audits paid and grants the term once inside the same transaction", async () => {
        const { service, entitlement, tx } = await world({ query: settled(purchaseRow()) })
        const confirmed = sepayConfirmation()
        let outcomesAtGrant: ReadonlyArray<string> = []
        entitlement.grantWith.mockImplementation(() => {
            outcomesAtGrant = [...tx.outcomes]
            return Promise.resolve(granted)
        })

        await expect(service.apply(confirmed)).resolves.toEqual({ outcome: "granted", granted })

        expect(outcomesAtGrant).not.toContain("commit")
        expect(tx.em.query).toHaveBeenCalledWith(MARK_PAID, [PURCHASE_ID, "tx-1", new Date(NOW), new Date(NOW)])
        auditEvent(tx, "paid", "sepay")
        expect(entitlement.grantWith).toHaveBeenCalledWith(expect.anything(), {
            learnerId: LEARNER_ID,
            term: "monthly",
            confirmedAt: new Date(NOW),
        })
        expect(tx.commits).toBe(1)
    })

    it("rolls the paid mark back when the grant fails, so the provider's retry settles again", async () => {
        const { service, entitlement, notifications, tx } = await world({ query: settled(purchaseRow()) })
        const confirmed = sepayConfirmation()
        entitlement.grantWith.mockRejectedValue(new Error("grant failed"))

        await expect(service.apply(confirmed)).rejects.toThrow("grant failed")

        expect(tx.rollbacks).toBe(1)
        expect(tx.commits).toBe(0)
        expect(notifications.notify).not.toHaveBeenCalled()
    })

    it("answers a duplicate of the same provider reference without another grant or audit", async () => {
        const { service, entitlement, notifications, tx } = await world({
            query: [[LOCK_PURCHASE_BY_ORDER, [paidRow()]]],
        })
        const confirmed = sepayConfirmation()
        await expect(service.apply(confirmed)).resolves.toEqual({ outcome: "duplicate" })
        expect(notifications.notify).not.toHaveBeenCalled()
        expect(tx.em.query).not.toHaveBeenCalledWith(MARK_PAID, expect.any(Array))
        expect(tx.em.query).not.toHaveBeenCalledWith(INSERT_CONFIRMATION_REFUSAL, expect.any(Array))
        expect(entitlement.grantWith).not.toHaveBeenCalled()
    })

    it("grants once and audits late-paid for a canceled or expired-pending purchase", async () => {
        const canceled = await world({ query: settled(purchaseRow({ status: "canceled" })) })
        const canceledConfirmed = sepayConfirmation()
        canceled.entitlement.grantWith.mockResolvedValue(granted)

        await canceled.service.apply(canceledConfirmed)

        auditEvent(canceled.tx, "late-paid", "sepay")
        expect(canceled.entitlement.grantWith).toHaveBeenCalledTimes(1)

        const expired = await world({ query: settled(purchaseRow({ expires_at: new Date(EXPIRED_AT) })) })
        const expiredConfirmed = sepayConfirmation()
        expired.entitlement.grantWith.mockResolvedValue(granted)

        await expired.service.apply(expiredConfirmed)

        auditEvent(expired.tx, "late-paid", "sepay")
        expect(expired.entitlement.grantWith).toHaveBeenCalledTimes(1)
    })
})

describe("PurchaseSettlementService notifies", () => {
    it("tells the learner Premium is active after the commit, with the plan, the new end and the Premium link", async () => {
        const { service, entitlement, notifications, tx } = await world({ query: settled(purchaseRow()) })
        const confirmed = sepayConfirmation()
        entitlement.grantWith.mockResolvedValue(granted)
        let commitsAtNotify = 0
        notifications.notify.mockImplementation(() => {
            commitsAtNotify = tx.commits
            return Promise.resolve()
        })

        await service.apply(confirmed)

        expect(notifications.notify).toHaveBeenCalledTimes(1)
        expect(notifications.notify).toHaveBeenCalledWith(
            LEARNER_ID,
            "premium.activated",
            { plan: "monthly", until: LATER },
            "/premium",
        )
        expect(commitsAtNotify).toBe(1)
    })
})

describe("PurchaseSettlementService retries and replays", () => {})

describe("PurchaseSettlementService revokes a voided paid order", () => {
    const revokedQueries = (standing: ReadonlyArray<unknown>): ReadonlyArray<readonly [string, unknown]> => [
        [LOCK_PURCHASE_BY_ORDER, [paidRow()]],
        [LOCK_LEARNER_PREMIUM, [{ locked: "" }]],
        [MARK_VOIDED, [{ purchase_id: PURCHASE_ID }]],
        [INSERT_CONFIRMATION_REFUSAL, []],
        [INSERT_PURCHASE_EVENT, []],
        [SELECT_STANDING_GRANTS, standing],
    ]
    const later = { plan: "yearly", confirmed_at: new Date(LATER) }

    it("voids the order, audits the void and the revoke, and rebuilds Premium from the orders that still stand", async () => {
        const { service, entitlement, tx } = await world({ query: revokedQueries([later]) })
        const rebuilt: Entitlement = { learnerId: LEARNER_ID, premiumUntil: "2027-01-02T00:00:00.000Z", updatedAt: NOW }
        entitlement.rebuildWith.mockResolvedValue(rebuilt)

        await expect(service.apply(sepayConfirmation({ state: "voided" }))).resolves.toEqual({
            outcome: "revoked",
            entitlement: rebuilt,
        })

        expect(tx.em.query).toHaveBeenCalledWith(LOCK_LEARNER_PREMIUM, [LEARNER_ID])
        expect(tx.em.query).toHaveBeenCalledWith(MARK_VOIDED, [PURCHASE_ID, new Date(NOW)])
        refusal(tx, PURCHASE_ID, "payment-voided", "voided")
        auditEvent(tx, "premium-revoked", "sepay")
        expect(entitlement.rebuildWith).toHaveBeenCalledWith(expect.anything(), {
            learnerId: LEARNER_ID,
            grants: [{ term: "yearly", confirmedAt: new Date(LATER) }],
        })
        expect(tx.commits).toBe(1)
    })

    it("tells the learner after the commit that Premium was revoked, with the plan and the new end", async () => {
        const { service, entitlement, notifications, tx } = await world({ query: revokedQueries([]) })
        const ended: Entitlement = { learnerId: LEARNER_ID, premiumUntil: NOW, updatedAt: NOW }
        entitlement.rebuildWith.mockResolvedValue(ended)
        let outcomesAtNotice: ReadonlyArray<string> = []
        notifications.notify.mockImplementation(() => {
            outcomesAtNotice = [...tx.outcomes]
            return Promise.resolve()
        })

        await service.apply(sepayConfirmation({ state: "voided" }))

        expect(outcomesAtNotice).toContain("commit")
        expect(notifications.notify).toHaveBeenCalledWith(
            LEARNER_ID,
            "premium.revoked",
            { plan: "monthly", until: NOW },
            "/premium",
        )
        expect(entitlement.rebuildWith).toHaveBeenCalledWith(expect.anything(), { learnerId: LEARNER_ID, grants: [] })
    })

    it("rolls back and tells no one when the void write comes back empty", async () => {
        const { service, entitlement, notifications, tx } = await world({
            query: [
                [LOCK_PURCHASE_BY_ORDER, [paidRow()]],
                [LOCK_LEARNER_PREMIUM, [{ locked: "" }]],
                [MARK_VOIDED, []],
            ],
        })

        await expect(service.apply(sepayConfirmation({ state: "voided" }))).rejects.toMatchObject({
            code: PurchaseErrorCode.PurchaseMissing,
        })
        expect(tx.rollbacks).toBe(1)
        expect(entitlement.rebuildWith).not.toHaveBeenCalled()
        expect(notifications.notify).not.toHaveBeenCalled()
    })
})
