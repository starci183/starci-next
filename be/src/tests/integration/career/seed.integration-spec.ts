import { fakeIds } from "@starci/jest-preset"
import { careerSeedModules, useCareerWorld } from "../../world/career-world.options"
import { useTestWorld } from "../../world/use-test-world"

/**
 * The development seed of experience items (integration): with the seed enabled it creates one ai-graded, one pending and one
 * verified sample for a learner over the real database, the verified one public by its code, and a second run changes nothing.
 */
describe("experience development seed (integration)", () => {
    const world = useTestWorld({ modules: careerSeedModules })
    const w = useCareerWorld(world)
    const ids = fakeIds()

    it("seeds three samples in three states, idempotently", async () => {
        const learner = ids.next()
        const signer = ids.next()

        const first = await w.seeds().seed({ learnerId: learner, signerId: signer })
        const second = await w.seeds().seed({ learnerId: learner, signerId: signer })
        const mine = await w.reads().mine({ learnerId: learner, state: null })
        const verified = first.find((item) => item.state === "verified")

        expect(first.map((item) => item.state)).toEqual(["ai-graded", "pending-review", "verified"])
        expect(second.map((item) => item.itemId)).toEqual(first.map((item) => item.itemId))
        expect(mine.items).toHaveLength(3)
        await expect(w.reads().verify(verified?.verificationCode ?? "")).resolves.toMatchObject({
            state: "verified",
            signerRole: "TEACHER",
        })
    })
})
