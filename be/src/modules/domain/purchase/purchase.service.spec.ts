import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction, MockOf } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { ok, refused } from "@modules/platform/primitives"
import { EntitlementService } from "@modules/domain/entitlement"
import type { Entitlement } from "@modules/domain/entitlement"
import { PAYOS_CLIENT, PayosErrorCode } from "@modules/integrations/payos"
import type { PayosCheckout, PayosClient, PayosConfirmation } from "@modules/integrations/payos"
import { SEPAY_CLIENT, SepayErrorCode } from "@modules/integrations/sepay"
import type { SepayCheckout, SepayClient, SepayConfirmation } from "@modules/integrations/sepay"
import { PurchaseErrorCode } from "./errors/purchase.error"
import type { CreateCheckoutInput, PayosDeliveryInput, SepayDeliveryInput } from "./purchase.contracts"
import { PurchaseService } from "./purchase.service"
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

const NOW = "2026-01-01T00:00:00.000Z"
const LATER = "2026-01-02T00:00:00.000Z"
const LEARNER_ID = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const PURCHASE_ID = "11111111-1111-4111-8111-111111111111"
const SEPAY_SECRET = "sepay-spec-secret"
const SUCCESS_URL = "https://app.example/premium/ok"
const CANCEL_URL = "https://app.example/premium/cancel"
const ERROR_URL = "https://app.example/premium/error"
const EXPIRED_AT = "2025-12-31T00:00:00.000Z"

const granted: Entitlement = { learnerId: LEARNER_ID, premiumUntil: LATER, updatedAt: NOW }

const purchaseRow = (overrides?: Partial<PurchaseRow>): PurchaseRow => ({
    purchase_id: PURCHASE_ID,
    learner_id: LEARNER_ID,
    plan: "monthly",
    amount_vnd: 229_000,
    currency: "VND",
    rail: "sepay",
    order_code: "SE-7",
    provider_ref: null,
    status: "pending",
    created_at: new Date(NOW),
    updated_at: new Date(NOW),
    expires_at: new Date(LATER),
    confirmed_at: null,
    ...overrides,
})

const paidRow = (): PurchaseRow => purchaseRow({ status: "paid", provider_ref: "tx-1", confirmed_at: new Date(NOW) })

const checkoutInput = (overrides?: Partial<CreateCheckoutInput>): CreateCheckoutInput => ({
    learnerId: LEARNER_ID,
    plan: "monthly",
    successUrl: SUCCESS_URL,
    errorUrl: ERROR_URL,
    cancelUrl: CANCEL_URL,
    correlationId: "corr-1",
    ...overrides,
})

const sepayCheckout = (): SepayCheckout => ({
    rail: "sepay",
    orderCode: "SE-7",
    amount: 229_000,
    redirect: {
        method: "POST",
        url: "https://pay.sepay.test/form",
        fields: { order_invoice_number: "SE-7", signature: "sig-1" },
    },
})

const payosCheckout = (): PayosCheckout => ({
    rail: "payos",
    providerRef: "pl-1",
    orderCode: 42,
    amount: 229_000,
    redirect: { method: "GET", url: "https://pay.payos.test/pl-1" },
})

const sepayConfirmation = (overrides?: Partial<SepayConfirmation>): SepayConfirmation => ({
    rail: "sepay",
    providerRef: "tx-1",
    orderCode: "SE-7",
    amount: 229_000,
    ...overrides,
})

const payosConfirmation = (overrides?: Partial<PayosConfirmation>): PayosConfirmation => ({
    rail: "payos",
    providerRef: "tx-1",
    orderCode: 42,
    amount: 229_000,
    ...overrides,
})

const sepayDelivery = (overrides?: Partial<SepayDeliveryInput>): SepayDeliveryInput => ({
    rawBody: Buffer.from("{}", "utf8"),
    secretKey: SEPAY_SECRET,
    ...overrides,
})

const payosDelivery = (rawBody: Buffer | undefined = Buffer.from("{}", "utf8")): PayosDeliveryInput => ({ rawBody })

const auditEvent = (tx: FakeTransaction, type: string, rail: string, ref: string | null = "tx-1"): void => {
    expect(tx.em.query).toHaveBeenCalledWith(INSERT_PURCHASE_EVENT, [PURCHASE_ID, type, rail, ref, new Date(NOW)])
}

const closed = (tx: FakeTransaction, status: string): void => {
    expect(tx.em.query).toHaveBeenCalledWith(CLOSE_PENDING, [PURCHASE_ID, status, new Date(NOW)])
}

interface World {
    readonly service: PurchaseService
    readonly sepay: MockOf<SepayClient>
    readonly payos: MockOf<PayosClient>
    readonly entitlement: MockOf<EntitlementService>
    readonly tx: FakeTransaction
}

const world = async (stubs: { readonly query?: Array<readonly [string, unknown]> } = {}): Promise<World> => {
    const tx = fakeTransaction(mockEntityManager({ query: stubs.query ?? [] }))
    const sepay = mock<SepayClient>()
    const payos = mock<PayosClient>()
    const entitlement = mock<EntitlementService>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            PurchaseService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: SEPAY_CLIENT, useValue: sepay },
            { provide: PAYOS_CLIENT, useValue: payos },
            { provide: EntitlementService, useValue: entitlement },
        ],
    }).compile()
    return { service: moduleRef.get(PurchaseService), sepay, payos, entitlement, tx }
}

const inserted = (overrides?: Partial<PurchaseRow>): Array<readonly [string, unknown]> => [
    [SELECT_LAST_RAIL, []],
    [NEXT_ORDER_CODE, [{ order_code: 7n }]],
    [INSERT_PURCHASE, [purchaseRow(overrides)]],
]

const payosInserted = (last: Array<unknown>): Array<readonly [string, unknown]> => [
    [SELECT_LAST_RAIL, last],
    [NEXT_ORDER_CODE, [{ order_code: 42n }]],
    [INSERT_PURCHASE, [purchaseRow({ rail: "payos", order_code: "42" })]],
]

const settled = (row: PurchaseRow): Array<readonly [string, unknown]> => [
    [LOCK_PURCHASE_BY_ORDER, [row]],
    [MARK_PAID, [paidRow()]],
    [INSERT_PURCHASE_EVENT, []],
]

const closedAfter = (queries: Array<readonly [string, unknown]>): Array<readonly [string, unknown]> => [
    ...queries,
    [CLOSE_PENDING, [{ purchase_id: PURCHASE_ID }]],
    [INSERT_PURCHASE_EVENT, []],
]

describe("PurchaseService plans and createCheckout offers", () => {
    it("answers the two server-owned offers", async () => {
        const { service } = await world()
        await expect(service.plans()).resolves.toEqual([
            { plan: "monthly", term: "monthly", amountVnd: 229_000, currency: "VND" },
            { plan: "yearly", term: "yearly", amountVnd: 2_290_000, currency: "VND" },
        ])
    })

    it("refuses a plan no server-owned offer carries, an empty insert and an empty order sequence", async () => {
        const { service } = await world()
        await expect(service.createCheckout(checkoutInput({ plan: "weekly" }))).rejects.toMatchObject({
            code: PurchaseErrorCode.PlanUnknown,
        })
        const { service: noRow } = await world({
            query: [
                [SELECT_LAST_RAIL, []],
                [NEXT_ORDER_CODE, [{ order_code: 7n }]],
                [INSERT_PURCHASE, []],
            ],
        })
        await expect(noRow.createCheckout(checkoutInput())).rejects.toMatchObject({
            code: PurchaseErrorCode.PurchaseMissing,
        })
        const { service: noCode } = await world({
            query: [
                [SELECT_LAST_RAIL, []],
                [NEXT_ORDER_CODE, []],
            ],
        })
        await expect(noCode.createCheckout(checkoutInput())).rejects.toMatchObject({
            code: PurchaseErrorCode.PurchaseMissing,
        })
    })
})

describe("PurchaseService createCheckout rail selection", () => {
    it("defaults to sepay when the learner never bought and maps the signed form", async () => {
        const { service, sepay } = await world({ query: inserted() })
        sepay.createCheckout.mockReturnValue(ok(sepayCheckout()))

        const result = await service.createCheckout(checkoutInput())

        expect(result.rail).toBe("sepay")
        expect(result.purchase.orderCode).toBe("SE-7")
        expect(sepay.createCheckout).toHaveBeenCalledWith({
            orderCode: "SE-7",
            amount: 229_000,
            description: "Premium subscription",
            successUrl: SUCCESS_URL,
            errorUrl: ERROR_URL,
            cancelUrl: CANCEL_URL,
        })
        expect(result.redirect).toEqual({
            method: "POST",
            url: "https://pay.sepay.test/form",
            fields: { order_invoice_number: "SE-7", signature: "sig-1" },
        })
    })

    it("reuses the learner's last-used rail and maps the payos checkout request", async () => {
        const { service, payos } = await world({ query: payosInserted([{ rail: "payos" }]) })
        payos.createCheckout.mockResolvedValue(ok(payosCheckout()))

        const result = await service.createCheckout(checkoutInput())

        expect(result.rail).toBe("payos")
        expect(payos.createCheckout).toHaveBeenCalledWith({
            orderCode: 42,
            amount: 229_000,
            description: "Premium subscription",
            returnUrl: SUCCESS_URL,
            cancelUrl: CANCEL_URL,
            correlationId: "corr-1",
        })
        expect(result.redirect).toEqual({ method: "GET", url: "https://pay.payos.test/pl-1" })
    })

    it("lets a requested rail override the last-used rail", async () => {
        const { service, payos } = await world({ query: payosInserted([{ rail: "sepay" }]) })
        payos.createCheckout.mockResolvedValue(ok(payosCheckout()))

        const result = await service.createCheckout(checkoutInput({ rail: "payos" }))

        expect(result.rail).toBe("payos")
    })
})

describe("PurchaseService createCheckout refusal", () => {
    it("closes the purchase as failed and refuses when either rail refuses the checkout", async () => {
        const { service, sepay, tx } = await world({ query: closedAfter(inserted()) })
        sepay.createCheckout.mockReturnValue(refused(SepayErrorCode.CheckoutInvalid))

        await expect(service.createCheckout(checkoutInput())).rejects.toMatchObject({
            code: PurchaseErrorCode.CheckoutRefused,
        })
        closed(tx, "failed")
        auditEvent(tx, "checkout-refused", "sepay", null)
        expect(tx.commits).toBe(1)

        const payosWorld = await world({ query: closedAfter(payosInserted([])) })
        payosWorld.payos.createCheckout.mockResolvedValue(refused(PayosErrorCode.CheckoutRefused))

        await expect(payosWorld.service.createCheckout(checkoutInput({ rail: "payos" }))).rejects.toMatchObject({
            code: PurchaseErrorCode.CheckoutRefused,
        })
        auditEvent(payosWorld.tx, "checkout-refused", "payos", null)
    })
})

describe("PurchaseService purchaseView and cancel", () => {
    it("refuses a purchase id the learner does not own", async () => {
        const { service } = await world({ query: [[SELECT_PURCHASE, []]] })
        await expect(service.purchaseView(LEARNER_ID, PURCHASE_ID)).rejects.toMatchObject({
            code: PurchaseErrorCode.PurchaseMissing,
        })
    })

    it("returns a stored purchase, and expires a pending one past its expiry with an audit event", async () => {
        const { service } = await world({ query: [[SELECT_PURCHASE, [purchaseRow({ status: "paid" })]]] })
        const view = await service.purchaseView(LEARNER_ID, PURCHASE_ID)
        expect(view.status).toBe("paid")
        expect(view.purchaseId).toBe(PURCHASE_ID)

        const expired = await world({
            query: closedAfter([[SELECT_PURCHASE, [purchaseRow({ expires_at: new Date(EXPIRED_AT) })]]]),
        })
        const expiredView = await expired.service.purchaseView(LEARNER_ID, PURCHASE_ID)
        expect(expiredView.status).toBe("expired")
        closed(expired.tx, "expired")
        auditEvent(expired.tx, "expired", "sepay", null)
    })

    it("refuses a cancel of a purchase that is not pending, and cancels a pending one with an audit event", async () => {
        const { service } = await world({ query: [[SELECT_PURCHASE, [purchaseRow({ status: "paid" })]]] })
        await expect(service.cancel(LEARNER_ID, PURCHASE_ID)).rejects.toMatchObject({
            code: PurchaseErrorCode.PurchaseNotPayable,
        })

        const pending = await world({ query: closedAfter([[SELECT_PURCHASE, [purchaseRow()]]]) })
        const view = await pending.service.cancel(LEARNER_ID, PURCHASE_ID)
        expect(view.status).toBe("canceled")
        expect(view.updatedAt).toBe(NOW)
        closed(pending.tx, "canceled")
        auditEvent(pending.tx, "canceled", "sepay", null)
    })
})

describe("PurchaseService recordSepayDelivery and recordPayosDelivery", () => {
    it("refuses a sepay delivery the rail refuses to prove, naming the rail code", async () => {
        const { service, sepay } = await world()
        sepay.verifyConfirmation.mockReturnValue(refused(SepayErrorCode.SecretInvalid))
        await expect(service.recordSepayDelivery(sepayDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.ConfirmationRefused,
            params: { code: SepayErrorCode.SecretInvalid },
        })
    })

    it("hands the rail the parsed body and the secret header only when the delivery carried one", async () => {
        const { service, sepay } = await world({ query: [[LOCK_PURCHASE_BY_ORDER, []]] })
        sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation()))
        await expect(service.recordSepayDelivery(sepayDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.OrderUnknown,
        })
        expect(sepay.verifyConfirmation).toHaveBeenCalledWith({
            body: {},
            headers: { "x-secret-key": SEPAY_SECRET },
        })
        await expect(service.recordSepayDelivery(sepayDelivery({ secretKey: undefined }))).rejects.toMatchObject({
            code: PurchaseErrorCode.OrderUnknown,
        })
        expect(sepay.verifyConfirmation).toHaveBeenLastCalledWith({ body: {}, headers: {} })
    })

    it("refuses undecodable or absent request bytes before the rail sees them", async () => {
        const { service, sepay } = await world()
        await expect(
            service.recordSepayDelivery({ rawBody: Buffer.from("not-json", "utf8"), secretKey: SEPAY_SECRET }),
        ).rejects.toMatchObject({ code: PurchaseErrorCode.DeliveryMalformed })
        await expect(
            service.recordSepayDelivery({ rawBody: undefined, secretKey: SEPAY_SECRET }),
        ).rejects.toMatchObject({ code: PurchaseErrorCode.DeliveryMalformed })
        expect(sepay.verifyConfirmation).not.toHaveBeenCalled()
    })

    it("refuses a payos delivery the rail refuses to prove, naming the rail code", async () => {
        const { service, payos } = await world()
        payos.verifyConfirmation.mockReturnValue(refused(PayosErrorCode.SignatureInvalid))
        await expect(service.recordPayosDelivery(payosDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.ConfirmationRefused,
            params: { code: PayosErrorCode.SignatureInvalid },
        })
    })

    it("refuses undecodable request bytes before the rail sees them", async () => {
        const { service, payos } = await world()
        await expect(service.recordPayosDelivery({ rawBody: Buffer.from("not-json", "utf8") })).rejects.toMatchObject({
            code: PurchaseErrorCode.DeliveryMalformed,
        })
        expect(payos.verifyConfirmation).not.toHaveBeenCalled()
    })

    it("settles a verified paid webhook on the payos rail", async () => {
        const { service, payos, entitlement, tx } = await world({
            query: settled(purchaseRow({ rail: "payos", order_code: "42" })),
        })
        payos.verifyConfirmation.mockReturnValue(ok(payosConfirmation()))
        entitlement.grant.mockResolvedValue(granted)

        await service.recordPayosDelivery(payosDelivery())

        expect(payos.verifyConfirmation).toHaveBeenCalledWith({ body: {} })
        expect(tx.em.query).toHaveBeenCalledWith(LOCK_PURCHASE_BY_ORDER, ["payos", "42"])
        expect(tx.em.query).toHaveBeenCalledWith(MARK_PAID, [PURCHASE_ID, "tx-1", new Date(NOW), new Date(NOW)])
        expect(entitlement.grant).toHaveBeenCalledTimes(1)
    })
})

describe("PurchaseService settlement refusals", () => {
    it("refuses a confirmation naming an order never persisted, without a grant", async () => {
        const { service, sepay, entitlement, tx } = await world({ query: [[LOCK_PURCHASE_BY_ORDER, []]] })
        sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation()))
        await expect(service.recordSepayDelivery(sepayDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.OrderUnknown,
        })
        expect(tx.em.query).toHaveBeenCalledWith(LOCK_PURCHASE_BY_ORDER, ["sepay", "SE-7"])
        expect(entitlement.grant).not.toHaveBeenCalled()
    })

    it("refuses a paid purchase a different provider reference names, and rolls the claim back", async () => {
        const { service, sepay, entitlement, tx } = await world({ query: [[LOCK_PURCHASE_BY_ORDER, [paidRow()]]] })
        sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation({ providerRef: "tx-2" })))
        await expect(service.recordSepayDelivery(sepayDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.ConfirmationMismatch,
        })
        expect(tx.rollbacks).toBe(1)
        expect(entitlement.grant).not.toHaveBeenCalled()
    })

    it("refuses a confirmation for a failed purchase", async () => {
        const { service, sepay, entitlement } = await world({
            query: [[LOCK_PURCHASE_BY_ORDER, [purchaseRow({ status: "failed" })]]],
        })
        sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation()))
        await expect(service.recordSepayDelivery(sepayDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.PurchaseNotPayable,
        })
        expect(entitlement.grant).not.toHaveBeenCalled()
    })

    it("refuses a confirmation whose amount or currency is not the purchase's, and an empty paid write", async () => {
        const amount = await world({ query: [[LOCK_PURCHASE_BY_ORDER, [purchaseRow()]]] })
        amount.sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation({ amount: 99_000 })))
        await expect(amount.service.recordSepayDelivery(sepayDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.ConfirmationMismatch,
        })
        expect(amount.entitlement.grant).not.toHaveBeenCalled()

        const currency = await world({
            query: [[LOCK_PURCHASE_BY_ORDER, [purchaseRow({ currency: "USD" })]]],
        })
        currency.sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation()))
        await expect(currency.service.recordSepayDelivery(sepayDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.ConfirmationMismatch,
        })
        expect(currency.entitlement.grant).not.toHaveBeenCalled()

        const write = await world({
            query: [
                [LOCK_PURCHASE_BY_ORDER, [purchaseRow()]],
                [MARK_PAID, []],
            ],
        })
        write.sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation()))
        await expect(write.service.recordSepayDelivery(sepayDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.PurchaseMissing,
        })
        expect(write.tx.rollbacks).toBe(1)
        expect(write.entitlement.grant).not.toHaveBeenCalled()
    })
})

describe("PurchaseService settlement applies", () => {
    it("marks a pending purchase paid, audits paid and grants the term once after commit", async () => {
        const { service, sepay, entitlement, tx } = await world({ query: settled(purchaseRow()) })
        sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation()))
        entitlement.grant.mockImplementation(() => {
            expect(tx.outcomes).toEqual(["commit"])
            return Promise.resolve(granted)
        })

        await service.recordSepayDelivery(sepayDelivery())

        expect(tx.em.query).toHaveBeenCalledWith(MARK_PAID, [PURCHASE_ID, "tx-1", new Date(NOW), new Date(NOW)])
        auditEvent(tx, "paid", "sepay")
        expect(entitlement.grant).toHaveBeenCalledWith({
            learnerId: LEARNER_ID,
            term: "monthly",
            confirmedAt: new Date(NOW),
        })
    })

    it("answers a duplicate of the same provider reference without another grant", async () => {
        const { service, sepay, entitlement, tx } = await world({ query: [[LOCK_PURCHASE_BY_ORDER, [paidRow()]]] })
        sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation()))
        await service.recordSepayDelivery(sepayDelivery())
        expect(tx.em.query).not.toHaveBeenCalledWith(MARK_PAID, expect.any(Array))
        expect(entitlement.grant).not.toHaveBeenCalled()
    })

    it("grants once and audits late-paid for a canceled or expired-pending purchase", async () => {
        const canceled = await world({ query: settled(purchaseRow({ status: "canceled" })) })
        canceled.sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation()))
        canceled.entitlement.grant.mockResolvedValue(granted)

        await canceled.service.recordSepayDelivery(sepayDelivery())

        auditEvent(canceled.tx, "late-paid", "sepay")
        expect(canceled.entitlement.grant).toHaveBeenCalledTimes(1)

        const expired = await world({ query: settled(purchaseRow({ expires_at: new Date(EXPIRED_AT) })) })
        expired.sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation()))
        expired.entitlement.grant.mockResolvedValue(granted)

        await expired.service.recordSepayDelivery(sepayDelivery())

        auditEvent(expired.tx, "late-paid", "sepay")
        expect(expired.entitlement.grant).toHaveBeenCalledTimes(1)
    })
})
