import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import {
    InjectEntitlementService,
    type Entitlement,
    type EntitlementService,
    type PremiumTerm,
} from "@modules/domain/entitlement"
import { InjectNotificationProducer, type NotificationProducerPort } from "@modules/domain/notification"
import { PurchaseError, PurchaseErrorCode } from "./errors/purchase.error"
import type { ConfirmationRefusal, Purchase, PurchaseSettlement, RailConfirmation } from "./purchase.contracts"
import { toPurchase, type PurchaseRow } from "./persistence/purchase.rows"
import {
    INSERT_CONFIRMATION_REFUSAL,
    INSERT_PURCHASE_EVENT,
    LOCK_LEARNER_PREMIUM,
    LOCK_PURCHASE_BY_ORDER,
    MARK_PAID,
    MARK_VOIDED,
    SELECT_STANDING_GRANTS,
} from "./persistence/purchase.sql"

/** One paid purchase of a learner that still stands, as the rebuild after a void reads it. */
interface StandingRow {
    readonly plan: PremiumTerm
    readonly confirmed_at: Date
}

/** What the learner is told after the commit: Premium granted or revoked, for the plan of the order. */
interface Notice {
    readonly kind: "premium.activated" | "premium.revoked"
    readonly plan: PremiumTerm
}

/** What one settlement transaction answers: the settlement, and the notice only when Premium changed. */
interface Applied {
    readonly settlement: PurchaseSettlement
    readonly notice: Notice | null
}

/** What one verified confirmation does to its locked purchase. */
type SettlementDecision =
    | { readonly kind: "settle"; readonly purchase: Purchase }
    | { readonly kind: "revoke"; readonly purchase: Purchase }
    | { readonly kind: "duplicate" }
    | { readonly kind: "refused"; readonly reason: ConfirmationRefusal }

/** The entitlement a settlement changed, or null when it changed none. */
const premiumOf = (settlement: PurchaseSettlement): Entitlement | null => {
    if (settlement.outcome === "granted") return settlement.granted
    if (settlement.outcome === "revoked") return settlement.entitlement
    return null
}

@Injectable()
/**
 * The one settlement of verified provider confirmations: recorded once under `(rail, provider_ref)`, with the entitlement
 * grant in the same transaction as the paid mark, so a paid order never exists without its grant.
 */
export class PurchaseSettlementService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectNotificationProducer() private readonly notifications: NotificationProducerPort,
    ) {}

    /**
     * Applies one verified confirmation in one transaction: it locks the purchase by rail and order code, answers a
     * duplicate by its stored provider reference, records paid with its audit event and grants the term through the same
     * transaction, so the paid mark and the grant commit together or not at all and a provider retry after any failure
     * settles again. A late confirmation of a canceled or expired purchase is paid once with a `late-paid` audit. A
     * verified delivery that cannot be applied (no such order, a second payment, a failed purchase, another amount or
     * currency, not reported paid, or voided) is recorded once as a `confirmation-refused` or `payment-voided` event with
     * the facts it reported, and grants nothing. After the commit of a grant it tells the learner through the notification
     * port (`premium.activated`, params `plan` and `until`, link `/premium`); the port never rejects, and a duplicate
     * delivery notifies nothing, so a provider retry does not tell the learner twice. A verified void of a paid order
     * (SePay `TRANSACTION_VOID`) revokes exactly the Premium time that order added, in the same transaction: the purchase
     * becomes `voided`, `payment-voided` and `premium-revoked` are recorded, and the learner's end is rebuilt from the paid
     * orders that still stand, so a later purchase's extension shifts back by the voided term. After the commit the learner
     * is told (`premium.revoked`, params `plan` and `until`); a repeated void finds the order voided and changes nothing.
     */
    async apply(confirmation: RailConfirmation): Promise<PurchaseSettlement> {
        const now = this.clock.now()
        const { settlement, notice } = await this.entityManager.transaction(async (manager): Promise<Applied> => {
            const rows: Array<PurchaseRow> = await manager.query(LOCK_PURCHASE_BY_ORDER, [
                confirmation.rail,
                confirmation.orderCode,
            ])
            const row = rows[0]
            const purchase = row ? toPurchase(row) : null
            const decision = this.decisionOf(purchase, confirmation)
            if (decision.kind === "duplicate") return { settlement: { outcome: "duplicate" }, notice: null }
            if (decision.kind === "refused") {
                await this.recordRefusal(manager, purchase, confirmation, decision.reason, now)
                return { settlement: { outcome: "refused", reason: decision.reason }, notice: null }
            }
            if (decision.kind === "revoke") return this.revoke(manager, decision.purchase, confirmation, now)
            return this.settle(manager, decision.purchase, confirmation, now)
        })
        const changed = premiumOf(settlement)
        if (notice !== null && changed !== null)
            await this.notifications.notify(
                changed.learnerId,
                notice.kind,
                { plan: notice.plan, until: changed.premiumUntil },
                "/premium",
            )
        return settlement
    }

    /**
     * Voids a paid purchase and takes back exactly the Premium time it added: the learner's Premium changes are serialized,
     * the purchase becomes `voided` with its `payment-voided` and `premium-revoked` audit, and the end is rebuilt from the
     * paid purchases that still stand, all through the settlement transaction.
     */
    private async revoke(
        manager: EntityManager,
        purchase: Purchase,
        confirmation: RailConfirmation,
        now: Date,
    ): Promise<Applied> {
        await manager.query(LOCK_LEARNER_PREMIUM, [purchase.learnerId])
        const voided: Array<{ purchase_id: string }> = await manager.query(MARK_VOIDED, [purchase.purchaseId, now])
        if (!voided[0]) throw new PurchaseError({ code: PurchaseErrorCode.PurchaseMissing })
        await this.recordRefusal(manager, purchase, confirmation, "voided", now)
        await manager.query(INSERT_PURCHASE_EVENT, [
            purchase.purchaseId,
            "premium-revoked",
            confirmation.rail,
            confirmation.providerRef,
            now,
        ])
        const standing: Array<StandingRow> = await manager.query(SELECT_STANDING_GRANTS, [
            purchase.learnerId,
            LIST_ROWS_MAX,
        ])
        const entitlement: Entitlement = await this.entitlement.rebuildWith(manager, {
            learnerId: purchase.learnerId,
            grants: standing.map((row) => ({ term: row.plan, confirmedAt: row.confirmed_at })),
        })
        return {
            settlement: { outcome: "revoked", entitlement },
            notice: { kind: "premium.revoked", plan: purchase.plan },
        }
    }

    /** Marks the purchase paid with its audit event and grants the term, all through the settlement transaction. */
    private async settle(
        manager: EntityManager,
        purchase: Purchase,
        confirmation: RailConfirmation,
        now: Date,
    ): Promise<Applied> {
        const late = purchase.status !== "pending" || purchase.expiresAt <= now.toISOString()
        await manager.query(LOCK_LEARNER_PREMIUM, [purchase.learnerId])
        const paid: Array<PurchaseRow> = await manager.query(MARK_PAID, [
            purchase.purchaseId,
            confirmation.providerRef,
            now,
            now,
        ])
        if (!paid[0]) throw new PurchaseError({ code: PurchaseErrorCode.PurchaseMissing })
        await manager.query(INSERT_PURCHASE_EVENT, [
            purchase.purchaseId,
            late ? "late-paid" : "paid",
            confirmation.rail,
            confirmation.providerRef,
            now,
        ])
        const granted: Entitlement = await this.entitlement.grantWith(manager, {
            learnerId: purchase.learnerId,
            term: purchase.plan,
            confirmedAt: now,
        })
        return {
            settlement: { outcome: "granted", granted },
            notice: { kind: "premium.activated", plan: purchase.plan },
        }
    }

    /**
     * What a verified confirmation does to the locked purchase: settles it, replays the recorded provider reference
     * (`duplicate`), or is refused with its reason. A voided or unpaid report never settles; a void of a paid purchase
     * revokes it, and a void of any other purchase (or a repeated one) is only recorded.
     */
    private decisionOf(purchase: Purchase | null, confirmation: RailConfirmation): SettlementDecision {
        const refused = (reason: ConfirmationRefusal): SettlementDecision => ({ kind: "refused", reason })
        if (confirmation.state === "voided")
            return purchase !== null && purchase.status === "paid" ? { kind: "revoke", purchase } : refused("voided")
        if (purchase === null) return refused("order-unknown")
        if (confirmation.state !== "paid") return refused("not-paid")
        if (purchase.status === "paid")
            return purchase.providerRef === confirmation.providerRef ? { kind: "duplicate" } : refused("already-paid")
        if (purchase.status === "failed") return refused("not-payable")
        if (confirmation.currency !== "VND" || purchase.currency !== "VND") return refused("currency-mismatch")
        if (purchase.amountVnd !== confirmation.amount) return refused("amount-mismatch")
        return { kind: "settle", purchase }
    }

    /** Records one verified delivery that was not applied, with the facts it reported; a retried one adds no second row. */
    private async recordRefusal(
        manager: EntityManager,
        purchase: Purchase | null,
        confirmation: RailConfirmation,
        reason: ConfirmationRefusal,
        now: Date,
    ): Promise<void> {
        await manager.query(INSERT_CONFIRMATION_REFUSAL, [
            purchase === null ? null : purchase.purchaseId,
            reason === "voided" ? "payment-voided" : "confirmation-refused",
            confirmation.rail,
            confirmation.providerRef,
            confirmation.orderCode,
            Number.isSafeInteger(confirmation.amount) ? confirmation.amount : null,
            confirmation.currency,
            reason,
            now,
        ])
    }
}
