import { builder } from "@starci/jest-preset"
import { ENTITLEMENT_BY_LEARNER } from "../../fixtures/persistence/commerce-entitlement.sql"
import { useTestWorld } from "../../world/use-test-world"

const learnerOf = builder<{ learnerId: string }>({ learnerId: "10000000-0000-4000-8000-000000000005" })

/** The production core app's entitlement schema and persisted read state. */
describe("commerce entitlement (e2e)", () => {
    const world = useTestWorld({ apps: ["core"] })

    it("boots the production core with an empty entitlement for a new learner", async () => {
        const learner = learnerOf()
        const health = await world.apps.core?.api.get("/health/ready")
        const rows = await world.db.primary?.query<
            Array<{ learner_id: string; premium_until: Date; updated_at: Date }>
        >(ENTITLEMENT_BY_LEARNER, [learner.learnerId])

        expect(health?.status).toBe(200)
        expect(health?.body).toEqual({ ok: true })
        expect(rows).toEqual([])
    })
})
