import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { Outcome } from "@modules/platform/primitives"
import {
    InjectSepayClient,
    SepayErrorCode,
    type SepayCheckout,
    type SepayCheckoutInput,
    type SepayCheckoutRedirect,
    type SepayClient,
    type SepayConfirmation,
    type SepayConfirmationHeaders,
    type SepayConfirmationInput,
} from "@modules/integrations/sepay"
import {
    InjectPayosClient,
    PayosErrorCode,
    type PayosCheckout,
    type PayosCheckoutInput,
    type PayosCheckoutRedirect,
    type PayosClient,
    type PayosConfirmation,
    type PayosConfirmationInput,
} from "@modules/integrations/payos"
import { PurchaseError, PurchaseErrorCode } from "./errors/purchase.error"
import { OFFERS, PAYMENT_RAILS } from "./offer.policy"
import { InjectPurchaseOptions } from "./purchase.decorators"
import { PurchaseSettlementService } from "./purchase-settlement.service"
import type {
    CheckoutRedirect,
    CreateCheckoutInput,
    Offer,
    OptionalRail,
    PaymentRail,
    PayosDeliveryInput,
    Purchase,
    PurchaseCheckout,
    PurchaseSettlement,
    RailConfirmation,
    SepayDeliveryInput,
} from "./purchase.contracts"
import type { PurchaseOptions } from "./purchase.options"
import { toPurchase, type PurchaseRow } from "./persistence/purchase.rows"
import {
    CLOSE_PENDING,
    INSERT_PURCHASE,
    INSERT_PURCHASE_EVENT,
    NEXT_ORDER_CODE,
    SELECT_LAST_RAIL,
    SELECT_PURCHASE,
} from "./persistence/purchase.sql"

/** How long a pending purchase stays payable before it lapses to expired. */
const CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000

/** The checkout description the provider shows the buyer. */
const CHECKOUT_DESCRIPTION = "Premium subscription"

/** The web app route the provider sends the buyer back to; it only displays the order the server reads. */
const RETURN_PATH = "/premium/result"

/** Where the provider sends the buyer after paying, failing and cancelling. */
interface ReturnUrls {
    readonly successUrl: string
    readonly errorUrl: string
    readonly cancelUrl: string
}

@Injectable()
/**
 * The Premium purchase capability: server-owned offers, checkout on the chosen rail, verified provider
 * confirmations recorded once under `(rail, provider_ref)`, and the entitlement grant in the same transaction as the paid
 * mark, so a paid order never exists without its grant.
 */
export class PurchaseService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectSepayClient() private readonly sepay: SepayClient,
        @InjectPayosClient() private readonly payos: PayosClient,
        private readonly settlement: PurchaseSettlementService,
        @InjectPurchaseOptions() private readonly options: PurchaseOptions,
    ) {}

    /** The server-owned Premium offers, the only plans and prices a learner can buy. */
    plans(): Promise<ReadonlyArray<Offer>> {
        return Promise.resolve(OFFERS)
    }

    /**
     * Creates a pending purchase with its immutable offer snapshot and starts the provider checkout on
     * the chosen rail. Every call is its own order, so a repeated click never reuses or double-grants one; a refused
     * checkout closes the purchase as failed and is refused here too.
     */
    async createCheckout(input: CreateCheckoutInput): Promise<PurchaseCheckout> {
        const offer = this.offerFor(input.plan)
        const requested = this.requestedRail(input.rail)
        const rail = this.railFor(await this.lastUsedRail(input.learnerId), requested)
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
        const redirect = await this.startCheckout(rail, purchase, this.returnUrls(purchase))
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
        if (!row) throw new PurchaseError({ code: PurchaseErrorCode.OrderNotFound })
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
     * The SePay webhook intake: verifies the delivery through the SePay client before trusting any field, then applies
     * the confirmation once. An unproved delivery is refused before any write; a proved one is applied, answered as a
     * duplicate, or recorded as refused, and acknowledged in every case.
     */
    async recordSepayDelivery(input: SepayDeliveryInput): Promise<PurchaseSettlement> {
        const body = this.parseDelivery(input.rawBody)
        const headers: SepayConfirmationHeaders =
            input.secretKey === undefined ? {} : { "x-secret-key": input.secretKey }
        const delivery: SepayConfirmationInput = { body, headers }
        const settlement = await this.settleVerified(
            this.sepay.verifyConfirmation(delivery),
            (confirmation: SepayConfirmation) => confirmation,
        )
        return settlement
    }

    /**
     * The payOS webhook intake: verifies the delivery through the payOS client before trusting any field, then applies
     * the confirmation once. An unproved delivery is refused before any write; a proved one is applied, answered as a
     * duplicate, or recorded as refused, and acknowledged in every case.
     */
    async recordPayosDelivery(input: PayosDeliveryInput): Promise<PurchaseSettlement> {
        const body = this.parseDelivery(input.rawBody)
        const delivery: PayosConfirmationInput = { body }
        const settlement = await this.settleVerified(
            this.payos.verifyConfirmation(delivery),
            (confirmation: PayosConfirmation) => ({
                rail: confirmation.rail,
                state: confirmation.state,
                orderCode: String(confirmation.orderCode),
                providerRef: confirmation.providerRef,
                amount: confirmation.amount,
                currency: confirmation.currency,
            }),
        )
        return settlement
    }

    /** Refuses a delivery its rail did not prove; a proved one is applied once through the shared settlement. */
    private settleVerified<V>(
        outcome: Outcome<V, SepayErrorCode | PayosErrorCode>,
        confirmationOf: (proved: V) => RailConfirmation,
    ): Promise<PurchaseSettlement> {
        if (outcome.kind === "refused") {
            throw new PurchaseError({ code: PurchaseErrorCode.ConfirmationRefused, params: { code: outcome.code } })
        }
        return this.settlement.apply(confirmationOf(outcome.value))
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

    /** The rail the learner named, or null when none was named; a name no rail carries is refused. */
    private requestedRail(name: string | null): PaymentRail | null {
        if (name === null) return null
        const rail = PAYMENT_RAILS.find((entry) => entry === name)
        if (!rail) throw new PurchaseError({ code: PurchaseErrorCode.RailUnknown })
        return rail
    }

    /** The provider return addresses of one purchase: the web app's result route, which displays the order the server reads. */
    private returnUrls(purchase: Purchase): ReturnUrls {
        const urlOf = (result: string): string =>
            `${this.options.returnBaseUrl}${RETURN_PATH}?${new URLSearchParams({ order: purchase.purchaseId, result }).toString()}`
        return { successUrl: urlOf("success"), errorUrl: urlOf("error"), cancelUrl: urlOf("cancel") }
    }

    /** The rail a checkout starts on: the learner's last-used rail when one is recorded, SePay otherwise. */
    private railFor(lastUsed: PaymentRail | null, requested: PaymentRail | null): PaymentRail {
        return requested ?? lastUsed ?? "sepay"
    }

    /** The rail of the learner's most recent purchase, or null when they never bought. */
    async lastUsedRail(learnerId: string): Promise<OptionalRail> {
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
    private startCheckout(rail: PaymentRail, purchase: Purchase, urls: ReturnUrls): Promise<CheckoutRedirect | null> {
        return rail === "sepay"
            ? Promise.resolve(this.startSepayCheckout(purchase, urls))
            : this.startPayosCheckout(purchase, urls)
    }

    /** Starts the SePay signed-form checkout of one purchase; a refusal answers null. */
    private startSepayCheckout(purchase: Purchase, urls: ReturnUrls): CheckoutRedirect | null {
        const checkoutInput: SepayCheckoutInput = {
            orderCode: purchase.orderCode,
            amount: purchase.amountVnd,
            description: CHECKOUT_DESCRIPTION,
            successUrl: urls.successUrl,
            errorUrl: urls.errorUrl,
            cancelUrl: urls.cancelUrl,
        }
        const outcome = this.sepay.createCheckout(checkoutInput)
        if (outcome.kind === "refused") return null
        const checkout: SepayCheckout = outcome.value
        const redirect: SepayCheckoutRedirect = checkout.redirect
        const fields = Object.entries(redirect.fields).map(([name, value]) => ({ name, value }))
        return { method: redirect.method, url: redirect.url, fields }
    }

    /** Starts the payOS hosted-link checkout of one purchase; a refusal answers null. */
    private async startPayosCheckout(purchase: Purchase, urls: ReturnUrls): Promise<CheckoutRedirect | null> {
        const checkoutInput: PayosCheckoutInput = {
            orderCode: Number(purchase.orderCode),
            amount: purchase.amountVnd,
            description: CHECKOUT_DESCRIPTION,
            returnUrl: urls.successUrl,
            cancelUrl: urls.cancelUrl,
            correlationId: purchase.purchaseId,
        }
        const outcome = await this.payos.createCheckout(checkoutInput)
        if (outcome.kind === "refused") return null
        const checkout: PayosCheckout = outcome.value
        const redirect: PayosCheckoutRedirect = checkout.redirect
        return { method: redirect.method, url: redirect.url, fields: [] }
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
