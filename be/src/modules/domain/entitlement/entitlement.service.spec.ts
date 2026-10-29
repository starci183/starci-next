import { FakeClock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { EntitlementErrorCode } from "./errors/entitlement.error"
import { EntitlementService } from "./entitlement.service"
import { GRANT_ENTITLEMENT, SELECT_ENTITLEMENT } from "./persistence/entitlement.sql"

const NOW = "2026-01-31T12:30:00.000Z"
const LEARNER_ID = "b8099f0e-58c7-4685-8292-f3a49ec994b1"

const build = async (entityManager: MockEntityManager): Promise<EntitlementService> => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            EntitlementService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: entityManager },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
        ],
    }).compile()
    return moduleRef.get(EntitlementService)
}

describe("EntitlementService", () => {
    describe("premiumUntil", () => {
        it("returns the stored end instant or null for a learner without an entitlement", async () => {
            const em = mockEntityManager({
                query: [SELECT_ENTITLEMENT, [{ learner_id: LEARNER_ID, premium_until: new Date("2026-02-28T12:30:00.000Z"), updated_at: new Date(NOW) }]],
            })
            const service = await build(em)

            await expect(service.premiumUntil({ learnerId: LEARNER_ID })).resolves.toBe("2026-02-28T12:30:00.000Z")
            expect(em.query).toHaveBeenCalledWith(SELECT_ENTITLEMENT, [LEARNER_ID])
        })
    })

    describe("isPremium", () => {
        it("is true only while the stored end is later than the injected current time", async () => {
            const em = mockEntityManager({
                query: [SELECT_ENTITLEMENT, [{ learner_id: LEARNER_ID, premium_until: new Date("2026-01-31T12:30:00.001Z"), updated_at: new Date(NOW) }]],
            })
            const service = await build(em)

            await expect(service.isPremium(LEARNER_ID)).resolves.toBe(true)
        })

        it("treats expiry at the current instant as preview", async () => {
            const em = mockEntityManager({
                query: [SELECT_ENTITLEMENT, [{ learner_id: LEARNER_ID, premium_until: new Date(NOW), updated_at: new Date(NOW) }]],
            })
            const service = await build(em)

            await expect(service.isPremium(LEARNER_ID)).resolves.toBe(false)
        })

        it("returns false when there is no entitlement", async () => {
            const service = await build(mockEntityManager({ query: [SELECT_ENTITLEMENT, []] }))

            await expect(service.isPremium(LEARNER_ID)).resolves.toBe(false)
        })
    })

    describe("grant", () => {
        it.each([
            ["monthly", 1],
            ["yearly", 12],
        ] as const)("passes a %s term to the atomic grant", async (term, months) => {
            const confirmedAt = new Date(NOW)
            const row = { learner_id: LEARNER_ID, premium_until: new Date("2026-02-28T12:30:00.000Z"), updated_at: new Date(NOW) }
            const em = mockEntityManager({ query: [GRANT_ENTITLEMENT, [row]] })
            const service = await build(em)

            await expect(service.grant({ learnerId: LEARNER_ID, term, confirmedAt })).resolves.toEqual({
                learnerId: LEARNER_ID,
                premiumUntil: "2026-02-28T12:30:00.000Z",
                updatedAt: NOW,
            })
            expect(em.query).toHaveBeenCalledWith(GRANT_ENTITLEMENT, [LEARNER_ID, confirmedAt, new Date(NOW), months])
        })

        it("throws an internal error if the write returned no row", async () => {
            const service = await build(mockEntityManager({ query: [GRANT_ENTITLEMENT, []] }))

            await expect(service.grant({ learnerId: LEARNER_ID, term: "monthly", confirmedAt: new Date(NOW) })).rejects.toMatchObject({
                code: EntitlementErrorCode.EntitlementMissing,
            })
        })
    })
})
