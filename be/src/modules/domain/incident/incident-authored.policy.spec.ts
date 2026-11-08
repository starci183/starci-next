import { Test } from "@nestjs/testing"
import { DEFAULT_AUTHORED_INCIDENTS, incidentRank, incidentStatusOf } from "./incident-authored.policy"

const POLICY: unique symbol = Symbol("incident.authored-policy")

const build = async () => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => ({ incidentStatusOf, incidentRank }) }],
    }).compile()
    return moduleRef.get<{ incidentStatusOf: typeof incidentStatusOf; incidentRank: typeof incidentRank }>(POLICY)
}

describe("incident authored policy", () => {
    it("authors no incident yet", () => {
        expect(DEFAULT_AUTHORED_INCIDENTS).toEqual([])
    })

    it("marks a lesson named among the authored ones as authored", async () => {
        const policy = await build()

        expect(policy.incidentStatusOf("a", ["a"])).toBe("authored")
    })

    it("marks any other lesson as coming soon", async () => {
        const policy = await build()

        expect(policy.incidentStatusOf("b", ["a"])).toBe("coming-soon")
        expect(policy.incidentStatusOf("b", [])).toBe("coming-soon")
    })

    it("ranks authored before coming soon", async () => {
        const policy = await build()

        expect(policy.incidentRank("authored")).toBeLessThan(policy.incidentRank("coming-soon"))
    })
})
