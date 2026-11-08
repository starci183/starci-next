import { Test } from "@nestjs/testing"
import { resultOf } from "@tests/fixtures/builders/attempt.builder"
import { NO_OUTCOME_LEVELS, levelsOf } from "./outcome-level.policy"

const LEVEL_POLICY: unique symbol = Symbol("attempt.level-policy")

const build = async (): Promise<typeof levelsOf> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: LEVEL_POLICY, useFactory: () => levelsOf }],
    }).compile()
    return moduleRef.get<typeof levelsOf>(LEVEL_POLICY)
}

describe("levelsOf", () => {
    it("gives a diagnostic no levels, however well it went", async () => {
        const levels = await build()

        expect(levels("explain", resultOf({ isDiagnostic: true, score: 5, maxScore: 5 }))).toBe(NO_OUTCOME_LEVELS)
    })

    it.each([
        [1, 1, 2],
        [4, 5, 2],
        [3, 5, 1],
        [2.5, 5, 1],
        [2, 5, 0],
        [0, 5, 0],
    ])("shows understanding by the share %s of %s points for a non-exercise", async (score, maxScore, level) => {
        const levels = await build()

        expect(levels("explain", resultOf({ score, maxScore }))).toEqual({ understood: level, proved: 0 })
    })

    it("proves what an exercise shows", async () => {
        const levels = await build()

        expect(levels("exercise", resultOf({ score: 2, maxScore: 2 }))).toEqual({ understood: 2, proved: 2 })
    })

    it("gives no level for a result with no points possible", async () => {
        const levels = await build()

        expect(levels("choice", resultOf({ score: 0, maxScore: 0 }))).toEqual({ understood: 0, proved: 0 })
    })
})
