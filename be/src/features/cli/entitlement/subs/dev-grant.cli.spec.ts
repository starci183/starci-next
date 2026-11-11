import { mock } from "@starci/jest-preset"
import { Test } from "@nestjs/testing"
import { ENTITLEMENT_SERVICE, type EntitlementService } from "@modules/domain/entitlement"
import { DevGrantCli } from "./dev-grant.cli"

const LEARNER = "10000000-0000-4000-8000-0000000000c1"

const build = async () => {
    const entitlements = mock<EntitlementService>()
    entitlements.devGrant.mockResolvedValue({ learnerId: LEARNER, premiumUntil: "2027-01-31T12:30:00.000Z" })
    const moduleRef = await Test.createTestingModule({
        providers: [DevGrantCli, { provide: ENTITLEMENT_SERVICE, useValue: entitlements }],
    }).compile()
    return { command: moduleRef.get(DevGrantCli), entitlements }
}

describe("DevGrantCli", () => {
    it("delegates the learner and the term to the development grant once", async () => {
        const { command, entitlements } = await build()

        await command.run([], { learner: LEARNER, term: "yearly" })

        expect(entitlements.devGrant).toHaveBeenCalledWith({ learnerId: LEARNER, term: "yearly" })
        expect(entitlements.devGrant).toHaveBeenCalledTimes(1)
    })

    it("takes --learner and --term as given", async () => {
        const { command } = await build()

        expect(command.parseLearner(LEARNER)).toBe(LEARNER)
        expect(command.parseTerm("monthly")).toBe("monthly")
    })
})
