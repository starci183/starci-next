import { Test } from "@nestjs/testing"
import type { LessonPhase } from "./lesson.contracts"
import { needsPremium, premiumMarkOf } from "./lesson-access.policy"

const ACCESS_POLICY: unique symbol = Symbol("lesson.access-policy")
const policies = { needsPremium, premiumMarkOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: ACCESS_POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(ACCESS_POLICY)
}

describe("needsPremium", () => {
    it("with no mark leaves only the challenge phase free", async () => {
        const { needsPremium: needs } = await build()
        const phases: Array<LessonPhase | "retrieval"> = [
            "predict",
            "explore",
            "explain",
            "apply",
            "reflect",
            "retrieval",
        ]

        expect(needs("challenge", undefined)).toBe(false)
        expect(phases.map((phase) => needs(phase, undefined))).toEqual([true, true, true, true, true, true])
    })

    it("frees a phase the teacher marked isPremium false", async () => {
        const { needsPremium: needs } = await build()

        expect(needs("apply", false)).toBe(false)
    })

    it("holds back a phase the teacher marked isPremium true, even the challenge", async () => {
        const { needsPremium: needs } = await build()

        expect(needs("challenge", true)).toBe(true)
    })
})

describe("premiumMarkOf", () => {
    it("takes the section mark before the lesson mark and the lesson mark before none", async () => {
        const { premiumMarkOf: markOf } = await build()

        expect(markOf({ isPremium: false }, { isPremium: true })).toBe(false)
        expect(markOf({}, { isPremium: false })).toBe(false)
        expect(markOf(null, { isPremium: true })).toBe(true)
        expect(markOf({}, {})).toBeUndefined()
    })
})
