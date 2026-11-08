import { Test } from "@nestjs/testing"
import { mock } from "@starci/jest-preset"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { PurchaseError, PurchaseErrorCode } from "./errors/purchase.error"
import { PremiumReadService } from "./premium-read.service"
import type { Purchase } from "./purchase.contracts"
import { PurchaseService } from "./purchase.service"

const NOW = "2026-01-01T00:00:00.000Z"
const LATER = "2026-02-01T00:00:00.000Z"
const LEARNER_ID = "b8099f0e-58c7-4685-8292-f3a49ec994b1"
const PURCHASE_ID = "11111111-1111-4111-8111-111111111111"

const purchaseOf = (overrides?: Partial<Purchase>): Purchase => ({
    purchaseId: PURCHASE_ID,
    learnerId: LEARNER_ID,
    plan: "monthly",
    amountVnd: 229_000,
    currency: "VND",
    rail: "sepay",
    orderCode: "SE-7",
    providerRef: null,
    status: "pending",
    createdAt: NOW,
    updatedAt: NOW,
    expiresAt: LATER,
    confirmedAt: null,
    ...overrides,
})

const build = async () => {
    const purchases = mock<PurchaseService>()
    const entitlement = mock<EntitlementService>()
    const moduleRef = await Test.createTestingModule({
        providers: [
            PremiumReadService,
            { provide: PurchaseService, useValue: purchases },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
        ],
    }).compile()
    return { service: moduleRef.get(PremiumReadService), purchases, entitlement }
}

describe("PremiumReadService premiumOrder", () => {
    it("keeps a pending order verifying and never reads the entitlement for it", async () => {
        const { service, purchases, entitlement } = await build()
        purchases.purchaseView.mockResolvedValue(purchaseOf())

        await expect(service.premiumOrder(LEARNER_ID, PURCHASE_ID)).resolves.toEqual({
            orderId: PURCHASE_ID,
            status: "verifying",
            plan: "monthly",
            amountVnd: 229_000,
            rail: "sepay",
            orderCode: "SE-7",
            premiumUntil: null,
        })
        expect(purchases.purchaseView).toHaveBeenCalledWith(LEARNER_ID, PURCHASE_ID)
        expect(entitlement.premiumUntil).not.toHaveBeenCalled()
    })

    it("shows a settled order active with the learner Premium end", async () => {
        const { service, purchases, entitlement } = await build()
        purchases.purchaseView.mockResolvedValue(purchaseOf({ status: "paid" }))
        entitlement.premiumUntil.mockResolvedValue(LATER)

        await expect(service.premiumOrder(LEARNER_ID, PURCHASE_ID)).resolves.toMatchObject({
            status: "active",
            premiumUntil: LATER,
        })
        expect(entitlement.premiumUntil).toHaveBeenCalledWith({ learnerId: LEARNER_ID })
    })

    it("keeps a settled order verifying until its entitlement has landed", async () => {
        const { service, purchases, entitlement } = await build()
        purchases.purchaseView.mockResolvedValue(purchaseOf({ status: "paid" }))
        entitlement.premiumUntil.mockResolvedValue(null)

        await expect(service.premiumOrder(LEARNER_ID, PURCHASE_ID)).resolves.toMatchObject({
            status: "verifying",
            premiumUntil: null,
        })
    })

    it.each<[Purchase["status"], string]>([
        ["canceled", "failed"],
        ["failed", "failed"],
        ["expired", "expired"],
    ])("shows a %s order as %s", async (status, shown) => {
        const { service, purchases } = await build()
        purchases.purchaseView.mockResolvedValue(purchaseOf({ status }))

        await expect(service.premiumOrder(LEARNER_ID, PURCHASE_ID)).resolves.toMatchObject({ status: shown })
    })

    it("lets the not-found of another learner order through", async () => {
        const { service, purchases } = await build()
        purchases.purchaseView.mockRejectedValue(new PurchaseError({ code: PurchaseErrorCode.OrderNotFound }))

        await expect(service.premiumOrder("b8099f0e-58c7-4685-8292-f3a49ec994b2", PURCHASE_ID)).rejects.toMatchObject({
            code: PurchaseErrorCode.OrderNotFound,
        })
    })
})

describe("PremiumReadService premiumStatus", () => {
    it("answers access now, the stored end and the last rail used", async () => {
        const { service, purchases, entitlement } = await build()
        entitlement.isPremium.mockResolvedValue(true)
        entitlement.premiumUntil.mockResolvedValue(LATER)
        purchases.lastUsedRail.mockResolvedValue("payos")

        await expect(service.premiumStatus(LEARNER_ID)).resolves.toEqual({
            isPremium: true,
            premiumUntil: LATER,
            lastRail: "payos",
        })
    })

    it("answers a learner who never bought without an end or a rail", async () => {
        const { service, purchases, entitlement } = await build()
        entitlement.isPremium.mockResolvedValue(false)
        entitlement.premiumUntil.mockResolvedValue(null)
        purchases.lastUsedRail.mockResolvedValue(null)

        await expect(service.premiumStatus(LEARNER_ID)).resolves.toEqual({
            isPremium: false,
            premiumUntil: null,
            lastRail: null,
        })
    })
})
