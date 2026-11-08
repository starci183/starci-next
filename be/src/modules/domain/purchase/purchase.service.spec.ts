import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import type { FakeTransaction, MockOf } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { ok, refused } from "@modules/platform/primitives"
import type { Entitlement } from "@modules/domain/entitlement"
import { PAYOS_CLIENT, PayosErrorCode } from "@modules/integrations/payos"
import type { PayosCheckout, PayosClient, PayosConfirmation } from "@modules/integrations/payos"
import { SEPAY_CLIENT, SepayErrorCode } from "@modules/integrations/sepay"
import type { SepayCheckout, SepayClient } from "@modules/integrations/sepay"
import {
    PURCHASE_EXPIRED_AT as EXPIRED_AT,
    PURCHASE_ID,
    PURCHASE_LATER as LATER,
    PURCHASE_LEARNER as LEARNER_ID,
    PURCHASE_NOW as NOW,
    purchaseRowOf as purchaseRow,
    sepayConfirmationOf as sepayConfirmation,
    type PurchaseRowShape,
} from "@tests/fixtures/builders/purchase.builder"
import { PURCHASE_ERROR_KINDS, PurchaseErrorCode } from "./errors/purchase.error"
import { PURCHASE_OPTIONS } from "./purchase.decorators"
import type { CreateCheckoutInput, PayosDeliveryInput, SepayDeliveryInput } from "./purchase.contracts"
import { PurchaseService } from "./purchase.service"
import { PurchaseSettlementService } from "./purchase-settlement.service"
import {
    CLOSE_PENDING,
    INSERT_PURCHASE,
    INSERT_PURCHASE_EVENT,
    NEXT_ORDER_CODE,
    SELECT_LAST_RAIL,
    SELECT_PURCHASE,
} from "./persistence/purchase.sql"

const SEPAY_SECRET = "sepay-spec-secret"
const RETURN_BASE = "https://app.example"
const returnUrl = (result: string): string => `${RETURN_BASE}/premium/result?order=${PURCHASE_ID}&result=${result}`

const granted: Entitlement = { learnerId: LEARNER_ID, premiumUntil: LATER, updatedAt: NOW }

const checkoutInput = (overrides?: Partial<CreateCheckoutInput>): CreateCheckoutInput => ({
    learnerId: LEARNER_ID,
    plan: "monthly",
    rail: null,
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

const payosConfirmation = (overrides?: Partial<PayosConfirmation>): PayosConfirmation => ({
    rail: "payos",
    state: "paid",
    providerRef: "tx-1",
    orderCode: 42,
    amount: 229_000,
    currency: "VND",
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
    readonly settlement: MockOf<PurchaseSettlementService>
    readonly tx: FakeTransaction
}

const world = async (stubs: { readonly query?: Array<readonly [string, unknown]> } = {}): Promise<World> => {
    const tx = fakeTransaction(mockEntityManager({ query: stubs.query ?? [] }))
    const sepay = mock<SepayClient>()
    const payos = mock<PayosClient>()
    const settlement = mock<PurchaseSettlementService>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            PurchaseService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: SEPAY_CLIENT, useValue: sepay },
            { provide: PAYOS_CLIENT, useValue: payos },
            { provide: PurchaseSettlementService, useValue: settlement },
            { provide: PURCHASE_OPTIONS, useValue: { returnBaseUrl: RETURN_BASE } },
        ],
    }).compile()
    return { service: moduleRef.get(PurchaseService), sepay, payos, settlement, tx }
}

const inserted = (overrides?: Partial<PurchaseRowShape>): Array<readonly [string, unknown]> => [
    [SELECT_LAST_RAIL, []],
    [NEXT_ORDER_CODE, [{ order_code: 7n }]],
    [INSERT_PURCHASE, [purchaseRow(overrides)]],
]

const payosInserted = (last: Array<unknown>): Array<readonly [string, unknown]> => [
    [SELECT_LAST_RAIL, last],
    [NEXT_ORDER_CODE, [{ order_code: 42n }]],
    [INSERT_PURCHASE, [purchaseRow({ rail: "payos", order_code: "42" })]],
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
            successUrl: returnUrl("success"),
            errorUrl: returnUrl("error"),
            cancelUrl: returnUrl("cancel"),
        })
        expect(result.redirect).toEqual({
            method: "POST",
            url: "https://pay.sepay.test/form",
            fields: [
                { name: "order_invoice_number", value: "SE-7" },
                { name: "signature", value: "sig-1" },
            ],
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
            returnUrl: returnUrl("success"),
            cancelUrl: returnUrl("cancel"),
            correlationId: PURCHASE_ID,
        })
        expect(result.redirect).toEqual({ method: "GET", url: "https://pay.payos.test/pl-1", fields: [] })
    })

    it("refuses a rail no capability serves before it touches the database", async () => {
        const { service, tx } = await world()

        await expect(service.createCheckout(checkoutInput({ rail: "paypal" }))).rejects.toMatchObject({
            code: PurchaseErrorCode.RailUnknown,
        })
        expect(tx.em.query).not.toHaveBeenCalled()
    })

    it("makes each click its own order priced from the server offer", async () => {
        const { service, sepay, tx } = await world({ query: inserted() })
        sepay.createCheckout.mockReturnValue(ok(sepayCheckout()))

        await service.createCheckout(checkoutInput({ plan: "yearly" }))
        await service.createCheckout(checkoutInput({ plan: "yearly" }))

        const inserts = tx.em.query.mock.calls.filter(([statement]) => statement === INSERT_PURCHASE)
        expect(inserts.map(([, params]) => params)).toEqual(
            Array(2).fill([LEARNER_ID, "yearly", 2_290_000, "sepay", "SE-7", new Date(NOW), new Date(LATER)]),
        )
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
    it("answers a purchase id the learner does not own as not found", async () => {
        const { service } = await world({ query: [[SELECT_PURCHASE, []]] })
        await expect(service.purchaseView(LEARNER_ID, PURCHASE_ID)).rejects.toMatchObject({
            code: PurchaseErrorCode.OrderNotFound,
        })
        expect(PURCHASE_ERROR_KINDS[PurchaseErrorCode.OrderNotFound]).toBe("not-found")
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
    it("refuses a delivery either rail refuses to prove, naming the rail code, before any settlement", async () => {
        const { service, sepay, payos, settlement } = await world()
        sepay.verifyConfirmation.mockReturnValue(refused(SepayErrorCode.SecretInvalid))
        payos.verifyConfirmation.mockReturnValue(refused(PayosErrorCode.SignatureInvalid))

        await expect(service.recordSepayDelivery(sepayDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.ConfirmationRefused,
            params: { code: SepayErrorCode.SecretInvalid },
        })
        await expect(service.recordPayosDelivery(payosDelivery())).rejects.toMatchObject({
            code: PurchaseErrorCode.ConfirmationRefused,
            params: { code: PayosErrorCode.SignatureInvalid },
        })
        expect(settlement.apply).not.toHaveBeenCalled()
    })

    it("hands the rail the parsed body and the secret header only when the delivery carried one", async () => {
        const { service, sepay, settlement } = await world()
        sepay.verifyConfirmation.mockReturnValue(ok(sepayConfirmation()))
        settlement.apply.mockResolvedValue({ outcome: "duplicate" })

        await expect(service.recordSepayDelivery(sepayDelivery())).resolves.toEqual({ outcome: "duplicate" })
        expect(sepay.verifyConfirmation).toHaveBeenCalledWith({ body: {}, headers: { "x-secret-key": SEPAY_SECRET } })
        await service.recordSepayDelivery(sepayDelivery({ secretKey: undefined }))
        expect(sepay.verifyConfirmation).toHaveBeenLastCalledWith({ body: {}, headers: {} })
        expect(settlement.apply).toHaveBeenCalledWith(sepayConfirmation())
    })

    it("refuses undecodable or absent request bytes before either rail sees them", async () => {
        const { service, sepay, payos } = await world()
        const sepayBytes = (rawBody: Buffer | undefined) =>
            service.recordSepayDelivery({ rawBody, secretKey: SEPAY_SECRET })
        await expect(sepayBytes(Buffer.from("not-json", "utf8"))).rejects.toMatchObject({
            code: PurchaseErrorCode.DeliveryMalformed,
        })
        await expect(sepayBytes(undefined)).rejects.toMatchObject({ code: PurchaseErrorCode.DeliveryMalformed })
        await expect(service.recordPayosDelivery({ rawBody: Buffer.from("not-json", "utf8") })).rejects.toMatchObject({
            code: PurchaseErrorCode.DeliveryMalformed,
        })
        expect(sepay.verifyConfirmation).not.toHaveBeenCalled()
        expect(payos.verifyConfirmation).not.toHaveBeenCalled()
    })

    it("maps a verified payos webhook into the shared confirmation and answers its settlement", async () => {
        const { service, payos, settlement } = await world()
        payos.verifyConfirmation.mockReturnValue(ok(payosConfirmation()))
        settlement.apply.mockResolvedValue({ outcome: "granted", granted })

        await expect(service.recordPayosDelivery(payosDelivery())).resolves.toEqual({ outcome: "granted", granted })

        expect(payos.verifyConfirmation).toHaveBeenCalledWith({ body: {} })
        expect(settlement.apply).toHaveBeenCalledWith({
            rail: "payos",
            state: "paid",
            orderCode: "42",
            providerRef: "tx-1",
            amount: 229_000,
            currency: "VND",
        })
    })
})
