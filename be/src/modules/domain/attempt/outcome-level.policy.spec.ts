import { Test } from "@nestjs/testing"
import { resultOf } from "@tests/fixtures/builders/attempt.builder"
import { NO_OUTCOME_LEVELS, PROVED_MUTATION_SCORE, levelsOf, provedLevelOf } from "./outcome-level.policy"

const LEVEL_POLICY: unique symbol = Symbol("attempt.level-policy")
const policies = { levelsOf, provedLevelOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: LEVEL_POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(LEVEL_POLICY)
}

describe("levelsOf", () => {
    it("gives a diagnostic no levels, however well it went", async () => {
        const { levelsOf: levels } = await build()

        expect(levels(resultOf({ isDiagnostic: true, score: 5, maxScore: 5 }))).toBe(NO_OUTCOME_LEVELS)
    })

    it.each([
        [1, 1, 2],
        [4, 5, 2],
        [3, 5, 1],
        [2.5, 5, 1],
        [2, 5, 0],
        [0, 5, 0],
    ])("shows understanding by the share %s of %s points and never proves", async (score, maxScore, level) => {
        const { levelsOf: levels } = await build()

        expect(levels(resultOf({ score, maxScore }))).toEqual({ understood: level, proved: 0 })
    })

    it("understands an apply exercise scoring 80% without proving it", async () => {
        const { levelsOf: levels } = await build()

        expect(levels(resultOf({ score: 4, maxScore: 5 }))).toEqual({ understood: 2, proved: 0 })
    })

    it("gives no level for a result with no points possible", async () => {
        const { levelsOf: levels } = await build()

        expect(levels(resultOf({ score: 0, maxScore: 0 }))).toEqual({ understood: 0, proved: 0 })
    })
})

describe("provedLevelOf", () => {
    it.each([PROVED_MUTATION_SCORE, 90, 100])("proves a concept at the incident mutation score %s", async (score) => {
        const { provedLevelOf: proved } = await build()

        expect(proved(score)).toBe(2)
    })

    it.each([0, 50, PROVED_MUTATION_SCORE - 1])("does not prove a concept below the threshold at %s", async (score) => {
        const { provedLevelOf: proved } = await build()

        expect(proved(score)).toBe(0)
    })

    it("does not prove a concept with no mutation score", async () => {
        const { provedLevelOf: proved } = await build()

        expect(proved(null)).toBe(0)
    })
})
