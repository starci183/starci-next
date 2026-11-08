import { Test } from "@nestjs/testing"
import { answerOf, bareActivityOf, codeOf } from "@tests/fixtures/builders/attempt.builder"
import { simulationActivityOf, simulationOf } from "@tests/fixtures/builders/lesson.builder"
import { AttemptErrorCode } from "./errors/attempt.error"
import { gradeSimulation } from "./simulation-grading.policy"

const SIMULATION_POLICY: unique symbol = Symbol("attempt.simulation-policy")

const build = async (): Promise<typeof gradeSimulation> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: SIMULATION_POLICY, useFactory: () => gradeSimulation }],
    }).compile()
    return moduleRef.get<typeof gradeSimulation>(SIMULATION_POLICY)
}

const ID = "demo--explore"
const invalid = AttemptErrorCode.AnswerInvalid

const pathOf = (actionIds: ReadonlyArray<string>, reachedStateId: string) =>
    answerOf({ actionIds: [...actionIds], reachedStateId })

describe("gradeSimulation of a valid path", () => {
    it("records a success when the path ends in a goal state", async () => {
        const grade = await build()

        const result = grade(simulationActivityOf("vi"), pathOf([`${ID}--a1`, `${ID}--a2`], `${ID}--s2`))

        expect(result).toEqual({
            isDiagnostic: false,
            correct: null,
            options: [],
            success: true,
            reachedStateId: `${ID}--s2`,
            criteria: [],
            score: 1,
            maxScore: 1,
        })
    })

    it("records a path that stops short of the goal, or does not move, as no success", async () => {
        const grade = await build()

        expect(grade(simulationActivityOf("vi"), pathOf([`${ID}--a1`], `${ID}--s1`))).toMatchObject({
            success: false,
            reachedStateId: `${ID}--s1`,
            score: 0,
        })
        expect(
            grade(simulationActivityOf("vi"), answerOf({ actionIds: null, reachedStateId: `${ID}--s0` })),
        ).toMatchObject({ success: false, reachedStateId: `${ID}--s0` })
    })

    it("marks a diagnostic simulation and treats a state it does not list as no success", async () => {
        const grade = await build()
        const activity = {
            ...simulationActivityOf("vi"),
            isDiagnostic: true,
            simulation: {
                ...simulationOf("vi"),
                transitions: [{ id: "t", fromStateId: `${ID}--s0`, actionId: `${ID}--a1`, toStateId: "ghost" }],
            },
        }

        const result = grade(activity, pathOf([`${ID}--a1`], "ghost"))

        expect(result).toMatchObject({ isDiagnostic: true, success: false, reachedStateId: "ghost" })
    })
})

describe("gradeSimulation of a path the machine refuses", () => {
    it.each([
        ["an action the state does not allow", pathOf([`${ID}--a2`], `${ID}--s2`)],
        ["a path that carries on after a refused step", pathOf([`${ID}--a9`, `${ID}--a2`], `${ID}--s2`)],
        ["a path that does not end where the learner says", pathOf([`${ID}--a1`], `${ID}--s2`)],
    ])("refuses %s", async (_name, answer) => {
        const grade = await build()

        expect(codeOf(() => grade(simulationActivityOf("vi"), answer))).toBe(invalid)
    })

    it("refuses an activity that holds no simulation", async () => {
        const grade = await build()

        expect(codeOf(() => grade(bareActivityOf({ kind: "simulation" }), pathOf([], `${ID}--s0`)))).toBe(invalid)
    })
})
