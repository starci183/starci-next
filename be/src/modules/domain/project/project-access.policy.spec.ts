import { mock } from "@starci/jest-preset"
import type { EntitlementService } from "@modules/domain/entitlement"
import { assertSubscriber } from "./project-access.policy"

const LEARNER = "b8099f0e-58c7-4685-8292-f3a49ec994b1"

describe("assertSubscriber", () => {
    it("lets a subscriber through, asking the one entitlement question", async () => {
        const entitlement = mock<EntitlementService>()
        entitlement.isPremium.mockResolvedValue(true)

        await expect(assertSubscriber(entitlement, LEARNER)).resolves.toBeUndefined()

        expect(entitlement.isPremium).toHaveBeenCalledWith(LEARNER)
    })

    it("refuses a learner without Premium with the typed Projects code", async () => {
        const entitlement = mock<EntitlementService>()
        entitlement.isPremium.mockResolvedValue(false)

        await expect(assertSubscriber(entitlement, LEARNER)).rejects.toMatchObject({
            code: "PROJECT_PREMIUM_REQUIRED",
        })
    })
})
