import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock } from "@modules/platform/clock"
import type { Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { EntitlementService } from "@modules/domain/entitlement"
import type { Entitlement, GrantPremiumParams } from "@modules/domain/entitlement"
import { InjectSepayClient, SepayErrorCode } from "@modules/integrations/sepay"
import type {
    SepayCheckout,
    SepayCheckoutInput,
    SepayCheckoutRedirect,
    SepayClient,
    SepayConfirmation,
    SepayConfirmationHeaders,
    SepayConfirmationInput,
} from "@modules/integrations/sepay"
import { InjectPayosClient, PayosErrorCode } from "@modules/integrations/payos"
import type {
    PayosCheckout,
    PayosCheckoutInput,
    PayosCheckoutRedirect,
    PayosClient,
    PayosConfirmation,
    PayosConfirmationInput,
} from "@modules/integrations/payos"
import { PurchaseError, PurchaseErrorCode } from "./errors/purchase.error"
import { OFFERS } from "./offer.policy"
import type {
    CheckoutRedirect,
    CreateCheckoutInput,
    Offer,
    PaymentRail,
    PayosDeliveryInput,
    Purchase,
    PurchaseCheckout,
    PurchaseSettlement,
    RailConfirmation,
    SepayDeliveryInput,
} from "./purchase.contracts"
import { toPurchase } from "./persistence/purchase.rows"
import type { PurchaseRow } from "./persistence/purchase.rows"
import {
    CLOSE_PENDING,
    INSERT_PURCHASE,
    INSERT_PURCHASE_EVENT,
    LOCK_PURCHASE_BY_ORDER,
    MARK_PAID,
    NEXT_ORDER_CODE,
    SELECT_LAST_RAIL,
    SELECT_PURCHASE,
} from "./persistence/purchase.sql"

/** How long a pending purchase stays payable before it lapses to expired. */
const CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000

/** The checkout description the provider shows the buyer. */
const CHECKOUT_DESCRIPTION = "Premium subscription"

@Injectable()
/**
 * The Premium purchase capability: server-owned offers, checkout on the chosen rail, verified provider
 * confirmations recorded once under `(rail, provider_ref)`, and the entitlement grant after commit.
 */
export class PurchaseService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectSepayClient() private readonly sepay: SepayClient,
        @InjectPayosClient() private readonly payos: PayosClient,
        private readonly entitlement: EntitlementService,
    ) {}

    /** The server-owned Premium offers, the only plans and prices a learner can buy. */
    plans(): Promise<ReadonlyArray<Offer>> {
        return Promise.resolve(OFFERS)
    }

    /**
     * Creates a pending purchase with its immutable offer snapshot and starts the provider checkout on
     * the chosen rail. A refused checkout closes the purchase as failed and is refused here too.
     */
    async createCheckout(input: CreateCheckoutInput): Promise<PurchaseCheckout> {
        const offer = this.offerFor(input.plan)
        const rail = this.railFor(await this.lastUsedRail(input.learnerId), input.rail)
        const now = this.clock.now()
        const expiresAt = new Date(now.getTime() + CHECKOUT_TTL_MS)
        const sequence = await this.nextOrderCode()
        const orderCode = rail === "payos" ? String(sequence) : `SE-${sequence}`
        const created: Array<PurchaseRow> = await this.entityManager.query(INSERT_PURCHASE, [
            input.learnerId,
            offer.plan,
            offer.amountVnd,
            rail,
            orderCode,
            now,
            expiresAt,
        ])
        const row = created[0]
        if (!row) throw new PurchaseError({ code: PurchaseErrorCode.PurchaseMissing })
        const purchase = toPurchase(row)
        const redirect = await this.startCheckout(rail, purchase, input)
        if (redirect === null) {
            await this.closeAsFailed(purchase.purchaseId, rail)
            throw new PurchaseError({ code: PurchaseErrorCode.CheckoutRefused, params: { rail } })
        }
        return { purchase, rail, redirect }
    }

    /** One purchase of one learner, for the checkout-result read; a foreign id is not found. */
    async purchaseView(learnerId: string, purchaseId: string): Promise<Purchase> {
        const rows: Array<PurchaseRow> = await this.entityManager.query(SELECT_PURCHASE, [learnerId, purchaseId])
        const row = rows[0]
        if (!row) throw new PurchaseError({ code: PurchaseErrorCode.PurchaseMissing })
        const purchase = toPurchase(row)
        if (purchase.status !== "pending" || purchase.expiresAt > this.clock.now().toISOString()) return purchase
        await this.closeExpired(purchase)
        return { ...purchase, status: "expired" }
    }

    /** Cancels a still-pending purchase of the learner, for the cancel-return read; never grants. */
    async cancel(learnerId: string, purchaseId: string): Promise<Purchase> {
        const purchase = await this.purchaseView(learnerId, purchaseId)
        if (purchase.status !== "pending") throw new PurchaseError({ code: PurchaseErrorCode.PurchaseNotPayable })
        const now = this.clock.now()
        await this.entityManager.transaction(async (manager) => {
            await manager.query(CLOSE_PENDING, [purchase.purchaseId, "canceled", now])
            await manager.query(INSERT_PURCHASE_EVENT, [purchase.purchaseId, "canceled", purchase.rail, null, now])
        })
        return { ...purchase, status: "canceled", updatedAt: now.toISOString() }
    }

    /**
     * The SePay webhook intake: verifies the delivery through the SePay client before trusting any field,
     * then applies the confirmation once. A refused verification or a duplicate is answered before any write.
     */
    async recordSepayDelivery(input: SepayDeliveryInput): Promise<void> {
        const body = this.parseDelivery(input.rawBody)
        const headers: SepayConfirmationHeaders =
            input.secretKey === undefined ? {} : { "x-secret-key": input.secretKey }
        const delivery: SepayConfirmationInput = { body, headers }
        const outcome = this.sepay.verifyConfirmation(delivery)
        if (outcome.kind === "refused") {
            const code: SepayErrorCode = outcome.code
            throw new PurchaseError({ code: PurchaseErrorCode.ConfirmationRefused, params: { code } })
        }
        const confirmation: SepayConfirmation = outcome.value
        await this.applyConfirmation({
            rail: confirmation.rail,
            orderCode: confirmation.orderCode,
            providerRef: confirmation.providerRef,
            amount: confirmation.amount,
        })
    }

    /**
     * The payOS webhook intake: verifies the delivery through the payOS client before trusting any field,
     * then applies the confirmation once. A refused verification or a duplicate is answered before any write.
     */
    async recordPayosDelivery(input: PayosDeliveryInput): Promise<void> {
        const body = this.parseDelivery(input.rawBody)
        const delivery: PayosConfirmationInput = { body }
        const outcome = await this.payos.verifyConfirmation(delivery)
        if (outcome.kind === "refused") {
            const code: PayosErrorCode = outcome.code
            throw new PurchaseError({ code: PurchaseErrorCode.ConfirmationRefused, params: { code } })
        }
        const confirmation: PayosConfirmation = outcome.value
        await this.applyConfirmation({
            rail: confirmation.rail,
            orderCode: String(confirmation.orderCode),
            providerRef: confirmation.providerRef,
            amount: confirmation.amount,
        })
    }

    /**
     * The one confirmation settlement: in the receipt transaction it locks the purchase by rail and order
     * code, refuses unknown, mismatched or non-payable rows, answers a duplicate by its stored provider
     * reference, records paid with its audit event, and returns the settlement the entitlement grant filled
     * after commit. A late confirmation of a canceled or expired purchase is paid once with a `late-paid` audit.
     */
    private async applyConfirmation(confirmation: RailConfirmation): Promise<PurchaseSettlement> {
        const now = this.clock.now()
        const grant = await this.entityManager.transaction(async (manager): Promise<GrantPremiumParams | null> => {
            const rows: Array<PurchaseRow> = await manager.query(LOCK_PURCHASE_BY_ORDER, [
                confirmation.rail,
                confirmation.orderCode,
            ])
            const row = rows[0]
            if (!row) throw new PurchaseError({ code: PurchaseErrorCode.OrderUnknown })
            const purchase = toPurchase(row)
            if (purchase.status === "paid") {
                if (purchase.providerRef === confirmation.providerRef) return null
                throw new PurchaseError({ code: PurchaseErrorCode.ConfirmationMismatch })
            }
            if (purchase.status === "failed") throw new PurchaseError({ code: PurchaseErrorCode.PurchaseNotPayable })
            if (purchase.amountVnd !== confirmation.amount || purchase.currency !== "VND") {
                throw new PurchaseError({ code: PurchaseErrorCode.ConfirmationMismatch })
            }
            const late = purchase.status !== "pending" || purchase.expiresAt <= now.toISOString()
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
            return { learnerId: purchase.learnerId, term: purchase.plan, confirmedAt: now }
        })
        if (grant === null) return { granted: null }
        const granted: Entitlement = await this.entitlement.grant(grant)
        return { granted }
    }

    /** Parses the delivery bytes; a body the rail cannot read is refused before verification. */
    private parseDelivery(rawBody: Buffer | undefined): unknown {
        if (!rawBody) throw new PurchaseError({ code: PurchaseErrorCode.DeliveryMalformed })
        try {
            const parsed: unknown = JSON.parse(rawBody.toString("utf8"))
            return parsed
        } catch (error) {
            throw new PurchaseError({ code: PurchaseErrorCode.DeliveryMalformed, cause: error })
        }
    }

    /** The offer a plan names; a name no server-owned offer carries is refused. */
    private offerFor(plan: string): Offer {
        const offer = OFFERS.find((entry) => entry.plan === plan)
        if (!offer) throw new PurchaseError({ code: PurchaseErrorCode.PlanUnknown })
        return offer
    }

    /** The rail a checkout starts on: the learner's last-used rail when one is recorded, SePay otherwise. */
    private railFor(lastUsed: PaymentRail | null, requested: PaymentRail | undefined): PaymentRail {
        return requested ?? lastUsed ?? "sepay"
    }

    /** The rail of the learner's most recent purchase, or null when they never bought. */
    private async lastUsedRail(learnerId: string): Promise<PaymentRail | null> {
        const rows: Array<{ rail: PaymentRail }> = await this.entityManager.query(SELECT_LAST_RAIL, [learnerId])
        const row = rows[0]
        return row ? row.rail : null
    }

    /** The next order code of the purchase sequence. */
    private async nextOrderCode(): Promise<bigint> {
        const rows: Array<{ order_code: bigint }> = await this.entityManager.query(NEXT_ORDER_CODE)
        const row = rows[0]
        if (!row) throw new PurchaseError({ code: PurchaseErrorCode.PurchaseMissing })
        return row.order_code
    }

    /** Starts the provider checkout of one persisted purchase; a rail refusal answers null. */
    private startCheckout(
        rail: PaymentRail,
        purchase: Purchase,
        input: CreateCheckoutInput,
    ): Promise<CheckoutRedirect | null> {
        return rail === "sepay"
            ? Promise.resolve(this.startSepayCheckout(purchase, input))
            : this.startPayosCheckout(purchase, input)
    }

    /** Starts the SePay signed-form checkout of one purchase; a refusal answers null. */
    private startSepayCheckout(purchase: Purchase, input: CreateCheckoutInput): CheckoutRedirect | null {
        const checkoutInput: SepayCheckoutInput = {
            orderCode: purchase.orderCode,
            amount: purchase.amountVnd,
            description: CHECKOUT_DESCRIPTION,
            successUrl: input.successUrl,
            errorUrl: input.errorUrl,
            cancelUrl: input.cancelUrl,
        }
        const outcome = this.sepay.createCheckout(checkoutInput)
        if (outcome.kind === "refused") return null
        const checkout: SepayCheckout = outcome.value
        const redirect: SepayCheckoutRedirect = checkout.redirect
        return { method: redirect.method, url: redirect.url, fields: redirect.fields }
    }

    /** Starts the payOS hosted-link checkout of one purchase; a refusal answers null. */
    private async startPayosCheckout(purchase: Purchase, input: CreateCheckoutInput): Promise<CheckoutRedirect | null> {
        const checkoutInput: PayosCheckoutInput = {
            orderCode: Number(purchase.orderCode),
            amount: purchase.amountVnd,
            description: CHECKOUT_DESCRIPTION,
            returnUrl: input.successUrl,
            cancelUrl: input.cancelUrl,
            correlationId: input.correlationId,
        }
        const outcome = await this.payos.createCheckout(checkoutInput)
        if (outcome.kind === "refused") return null
        const checkout: PayosCheckout = outcome.value
        const redirect: PayosCheckoutRedirect = checkout.redirect
        return { method: redirect.method, url: redirect.url }
    }

    /** Closes a purchase whose provider refused the checkout as failed, with its audit event. */
    private async closeAsFailed(purchaseId: string, rail: PaymentRail): Promise<void> {
        const now = this.clock.now()
        await this.entityManager.transaction(async (manager) => {
            await manager.query(CLOSE_PENDING, [purchaseId, "failed", now])
            await manager.query(INSERT_PURCHASE_EVENT, [purchaseId, "checkout-refused", rail, null, now])
        })
    }

    /** Marks a pending purchase past its expiry instant expired, with its audit event. */
    private async closeExpired(purchase: Purchase): Promise<void> {
        const now = this.clock.now()
        await this.entityManager.transaction(async (manager) => {
            await manager.query(CLOSE_PENDING, [purchase.purchaseId, "expired", now])
            await manager.query(INSERT_PURCHASE_EVENT, [purchase.purchaseId, "expired", purchase.rail, null, now])
        })
    }
}
