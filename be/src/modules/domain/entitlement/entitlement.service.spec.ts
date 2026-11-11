import { FakeClock, mockEntityManager } from "@starci/jest-preset"
import type { MockEntityManager } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { CLOCK } from "@modules/platform/clock"
import { ENTITLEMENT_OPTIONS } from "./entitlement.decorators"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { EntitlementError, EntitlementErrorCode } from "./errors/entitlement.error"
import { EntitlementService } from "./entitlement.service"
import {
    DELETE_ENTITLEMENT,
    END_ENTITLEMENT,
    GRANT_ENTITLEMENT,
    SELECT_ENTITLEMENT,
} from "./persistence/entitlement.sql"

const NOW = "2026-01-31T12:30:00.000Z"
const LEARNER_ID = "b8099f0e-58c7-4685-8292-f3a49ec994b1"

const build = async (entityManager: MockEntityManager, devGrant = false): Promise<EntitlementService> => {
    const moduleRef = await Test.createTestingModule({
        providers: [
            EntitlementService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: entityManager },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: ENTITLEMENT_OPTIONS, useValue: { devGrant } },
        ],
    }).compile()
    return moduleRef.get(EntitlementService)
}

describe("EntitlementService premiumUntil", () => {
    it("returns the stored end instant or null for a learner without an entitlement", async () => {
        const em = mockEntityManager({
            query: [
                SELECT_ENTITLEMENT,
                [
                    {
                        learner_id: LEARNER_ID,
                        premium_until: new Date("2026-02-28T12:30:00.000Z"),
                        updated_at: new Date(NOW),
                    },
                ],
            ],
        })
        const service = await build(em)

        await expect(service.premiumUntil({ learnerId: LEARNER_ID })).resolves.toBe("2026-02-28T12:30:00.000Z")
        expect(em.query).toHaveBeenCalledWith(SELECT_ENTITLEMENT, [LEARNER_ID])
    })
})

describe("EntitlementService isPremium", () => {
    it("is true only while the stored end is later than the injected current time", async () => {
        const em = mockEntityManager({
            query: [
                SELECT_ENTITLEMENT,
                [
                    {
                        learner_id: LEARNER_ID,
                        premium_until: new Date("2026-01-31T12:30:00.001Z"),
                        updated_at: new Date(NOW),
                    },
                ],
            ],
        })
        const service = await build(em)

        await expect(service.isPremium(LEARNER_ID)).resolves.toBe(true)
    })

    it("treats expiry at the current instant as preview", async () => {
        const em = mockEntityManager({
            query: [
                SELECT_ENTITLEMENT,
                [{ learner_id: LEARNER_ID, premium_until: new Date(NOW), updated_at: new Date(NOW) }],
            ],
        })
        const service = await build(em)

        await expect(service.isPremium(LEARNER_ID)).resolves.toBe(false)
    })

    it("returns false when there is no entitlement", async () => {
        const service = await build(mockEntityManager({ query: [SELECT_ENTITLEMENT, []] }))

        await expect(service.isPremium(LEARNER_ID)).resolves.toBe(false)
    })
})

describe("EntitlementService grant", () => {
    it.each([
        ["monthly", 1],
        ["yearly", 12],
    ] as const)("passes a %s term to the atomic grant", async (term, months) => {
        const confirmedAt = new Date(NOW)
        const row = {
            learner_id: LEARNER_ID,
            premium_until: new Date("2026-02-28T12:30:00.000Z"),
            updated_at: new Date(NOW),
        }
        const em = mockEntityManager({ query: [GRANT_ENTITLEMENT, [row]] })
        const service = await build(em)

        await expect(service.grant({ learnerId: LEARNER_ID, term, confirmedAt })).resolves.toEqual({
            learnerId: LEARNER_ID,
            premiumUntil: "2026-02-28T12:30:00.000Z",
            updatedAt: NOW,
        })
        expect(em.query).toHaveBeenCalledWith(GRANT_ENTITLEMENT, [LEARNER_ID, confirmedAt, new Date(NOW), months])
    })

    it("grants through the caller's transaction manager, never its own", async () => {
        const own = mockEntityManager()
        const service = await build(own)
        const row = { learner_id: LEARNER_ID, premium_until: new Date(NOW), updated_at: new Date(NOW) }
        const caller = mockEntityManager({ query: [GRANT_ENTITLEMENT, [row]] })

        await service.grantWith(caller, { learnerId: LEARNER_ID, term: "monthly", confirmedAt: new Date(NOW) })

        expect(caller.query).toHaveBeenCalledWith(GRANT_ENTITLEMENT, [LEARNER_ID, new Date(NOW), new Date(NOW), 1])
        expect(own.query).not.toHaveBeenCalled()
    })

    it("throws an internal error if the write returned no row", async () => {
        const service = await build(mockEntityManager({ query: [GRANT_ENTITLEMENT, []] }))

        await expect(
            service.grant({ learnerId: LEARNER_ID, term: "monthly", confirmedAt: new Date(NOW) }),
        ).rejects.toMatchObject({
            code: EntitlementErrorCode.EntitlementMissing,
        })
    })
})

describe("EntitlementService rebuildWith", () => {
    const rowAt = (until: string) => ({
        learner_id: LEARNER_ID,
        premium_until: new Date(until),
        updated_at: new Date(NOW),
    })

    it("drops the stored end and replays every standing grant in order, answering the last end", async () => {
        const service = await build(mockEntityManager())
        const caller = mockEntityManager({
            query: [
                [DELETE_ENTITLEMENT, []],
                [GRANT_ENTITLEMENT, [rowAt("2026-03-15T00:00:00.000Z")]],
            ],
        })
        const first = new Date("2026-01-15T00:00:00.000Z")
        const second = new Date("2026-02-01T00:00:00.000Z")

        const rebuilt = await service.rebuildWith(caller, {
            learnerId: LEARNER_ID,
            grants: [
                { term: "monthly", confirmedAt: first },
                { term: "monthly", confirmedAt: second },
            ],
        })

        expect(rebuilt.premiumUntil).toBe("2026-03-15T00:00:00.000Z")
        expect(caller.query.mock.calls.map(([statement]) => statement)).toEqual([
            DELETE_ENTITLEMENT,
            GRANT_ENTITLEMENT,
            GRANT_ENTITLEMENT,
        ])
        expect(caller.query).toHaveBeenNthCalledWith(2, GRANT_ENTITLEMENT, [LEARNER_ID, first, new Date(NOW), 1])
        expect(caller.query).toHaveBeenNthCalledWith(3, GRANT_ENTITLEMENT, [LEARNER_ID, second, new Date(NOW), 1])
    })

    it("ends Premium now when no grant stands", async () => {
        const service = await build(mockEntityManager())
        const caller = mockEntityManager({
            query: [
                [DELETE_ENTITLEMENT, []],
                [END_ENTITLEMENT, [rowAt(NOW)]],
            ],
        })

        await expect(service.rebuildWith(caller, { learnerId: LEARNER_ID, grants: [] })).resolves.toEqual({
            learnerId: LEARNER_ID,
            premiumUntil: NOW,
            updatedAt: NOW,
        })
        expect(caller.query).toHaveBeenCalledWith(END_ENTITLEMENT, [LEARNER_ID, new Date(NOW)])
    })

    it("throws an internal error if the ending write returned no row", async () => {
        const service = await build(mockEntityManager())
        const caller = mockEntityManager({
            query: [
                [DELETE_ENTITLEMENT, []],
                [END_ENTITLEMENT, []],
            ],
        })

        await expect(service.rebuildWith(caller, { learnerId: LEARNER_ID, grants: [] })).rejects.toMatchObject({
            code: EntitlementErrorCode.EntitlementMissing,
        })
    })
})

describe("EntitlementService devGrant", () => {
    it("is refused outside development and never writes", async () => {
        const em = mockEntityManager()
        const service = await build(em)

        expect(() => service.devGrant({ learnerId: LEARNER_ID, term: "yearly" })).toThrow(
            new EntitlementError({ code: EntitlementErrorCode.DevGrantDisabled }),
        )
        expect(em.query).not.toHaveBeenCalled()
    })

    it("grants the term confirmed now when the environment enables it", async () => {
        const row = {
            learner_id: LEARNER_ID,
            premium_until: new Date("2027-01-31T12:30:00.000Z"),
            updated_at: new Date(NOW),
        }
        const em = mockEntityManager({ query: [GRANT_ENTITLEMENT, [row]] })
        const service = await build(em, true)

        await expect(service.devGrant({ learnerId: LEARNER_ID, term: "yearly" })).resolves.toMatchObject({
            learnerId: LEARNER_ID,
        })
        expect(em.query).toHaveBeenCalledWith(GRANT_ENTITLEMENT, [LEARNER_ID, new Date(NOW), new Date(NOW), 12])
    })
})
