import { builder } from "@starci/jest-preset"
import { EntitlementModule, EntitlementService } from "@modules/domain/entitlement"

/** What one grant is given, as the service declares it. */
type GrantPremiumParams = Parameters<EntitlementService["grant"]>[0]
import { useTestWorld } from "../../world/use-test-world"

const grantParamsOf = builder<GrantPremiumParams>({
    learnerId: "10000000-0000-4000-8000-000000000001",
    term: "monthly",
    confirmedAt: new Date("2027-01-31T12:34:56.000Z"),
})

/** The real primary database behind the entitlement capability. */
describe("commerce entitlement (integration)", () => {
    const world = useTestWorld({ modules: [() => EntitlementModule.register({})] })
    const entitlement = (): EntitlementService => world.resolve(EntitlementService)

    it("extends a future end by one calendar month and persists the exact end", async () => {
        const service = entitlement()
        const first = await service.grant(grantParamsOf())
        const extended = await service.grant(grantParamsOf({ confirmedAt: new Date("2027-02-01T12:34:56.000Z") }))
        const persisted = await service.premiumUntil({ learnerId: grantParamsOf().learnerId })

        expect(first.premiumUntil).toBe("2027-02-28T12:34:56.000Z")
        expect(extended).toEqual({
            learnerId: "10000000-0000-4000-8000-000000000001",
            premiumUntil: "2027-03-28T12:34:56.000Z",
            updatedAt: extended.updatedAt,
        })
        expect(persisted).toBe("2027-03-28T12:34:56.000Z")
    })

    it("clamps month-end grants in leap and non-leap years while preserving UTC time", async () => {
        const service = entitlement()
        const leapFebruary = await service.grant(
            grantParamsOf({
                learnerId: "10000000-0000-4000-8000-000000000006",
                confirmedAt: new Date("2028-01-31T12:34:56.000Z"),
            }),
        )
        const leapYearly = await service.grant(
            grantParamsOf({
                learnerId: "10000000-0000-4000-8000-000000000007",
                term: "yearly",
                confirmedAt: new Date("2028-02-29T12:34:56.000Z"),
            }),
        )

        expect(leapFebruary.premiumUntil).toBe("2028-02-29T12:34:56.000Z")
        expect(await service.premiumUntil({ learnerId: "10000000-0000-4000-8000-000000000006" })).toBe(
            "2028-02-29T12:34:56.000Z",
        )
        expect(leapYearly.premiumUntil).toBe("2029-02-28T12:34:56.000Z")
        expect(await service.premiumUntil({ learnerId: "10000000-0000-4000-8000-000000000007" })).toBe(
            "2029-02-28T12:34:56.000Z",
        )
    })
})

/** The real primary database behind the entitlement capability: terms that start after an end. */
describe("commerce entitlement after an end (integration)", () => {
    const world = useTestWorld({ modules: [() => EntitlementModule.register({})] })
    const entitlement = (): EntitlementService => world.resolve(EntitlementService)

    it("starts an expired entitlement from confirmation and grants no grace after its end", async () => {
        const service = entitlement()
        const expired = await service.grant(
            grantParamsOf({
                learnerId: "10000000-0000-4000-8000-000000000002",
                confirmedAt: new Date("2025-01-31T12:34:56.000Z"),
            }),
        )
        const active = await service.grant(
            grantParamsOf({
                learnerId: "10000000-0000-4000-8000-000000000003",
                term: "yearly",
                confirmedAt: new Date("2027-01-31T12:34:56.000Z"),
            }),
        )

        expect(expired.premiumUntil).toBe("2025-02-28T12:34:56.000Z")
        await expect(service.isPremium("10000000-0000-4000-8000-000000000002")).resolves.toBe(false)
        expect(active.premiumUntil).toBe("2028-01-31T12:34:56.000Z")
        await expect(service.isPremium("10000000-0000-4000-8000-000000000003")).resolves.toBe(true)
        await expect(service.premiumUntil({ learnerId: "10000000-0000-4000-8000-000000000004" })).resolves.toBeNull()
    })

    it("restarts an expired term from the new confirmation instead of extending its old end", async () => {
        const service = entitlement()
        const learnerId = "10000000-0000-4000-8000-000000000008"
        await service.grant(
            grantParamsOf({
                learnerId,
                confirmedAt: new Date("2025-01-31T12:34:56.000Z"),
            }),
        )

        const restarted = await service.grant(
            grantParamsOf({
                learnerId,
                confirmedAt: new Date("2027-01-31T12:34:56.000Z"),
            }),
        )

        expect(restarted.premiumUntil).toBe("2027-02-28T12:34:56.000Z")
        expect(await service.premiumUntil({ learnerId })).toBe("2027-02-28T12:34:56.000Z")
    })
})
