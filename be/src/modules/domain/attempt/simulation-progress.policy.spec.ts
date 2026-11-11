import { Test } from "@nestjs/testing"
import { simulationActivityOf } from "@tests/fixtures/builders/lesson.builder"
import { AttemptErrorCode } from "./errors/attempt.error"
import { SIMULATION_PATH_MAX, simulationPositionOf } from "./simulation-progress.policy"

const POSITION_POLICY: unique symbol = Symbol("attempt.simulation-position-policy")

const build = async (): Promise<typeof simulationPositionOf> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POSITION_POLICY, useFactory: () => simulationPositionOf }],
    }).compile()
    return moduleRef.get<typeof simulationPositionOf>(POSITION_POLICY)
}

const activity = simulationActivityOf("en")
const S0 = "demo--explore--s0"
const S1 = "demo--explore--s1"
const S2 = "demo--explore--s2"
const A1 = "demo--explore--a1"
const A2 = "demo--explore--a2"

const codeOf = (run: () => unknown): unknown => {
    try {
        run()
    } catch (cause) {
        return cause instanceof Error && "code" in cause ? cause.code : cause
    }
    return null
}

describe("simulationPositionOf", () => {
    it("replays the path and answers the state and the transitions it takes", async () => {
        const positionOf = await build()

        expect(positionOf(activity, { currentStateId: S2, actionIds: [A1, A2] })).toEqual({
            currentStateId: S2,
            actionIds: [A1, A2],
            transitionIds: ["demo--explore--t1", "demo--explore--t2"],
        })
    })

    it("accepts the start, an empty path in the initial state", async () => {
        const positionOf = await build()

        expect(positionOf(activity, { currentStateId: S0, actionIds: [] }).transitionIds).toEqual([])
    })

    it.each([
        ["a step the machine does not allow", { currentStateId: S1, actionIds: [A2] }],
        ["a path that ends elsewhere", { currentStateId: S2, actionIds: [A1] }],
        [
            "a path too long",
            { currentStateId: S0, actionIds: Array.from({ length: SIMULATION_PATH_MAX + 1 }, () => A1) },
        ],
    ])("refuses %s", async (_case, params) => {
        const positionOf = await build()

        expect(codeOf(() => positionOf(activity, params))).toBe(AttemptErrorCode.AnswerInvalid)
    })

    it("refuses an activity that is not a simulation", async () => {
        const positionOf = await build()
        const { simulation: _unused, ...rest } = activity

        expect(codeOf(() => positionOf({ ...rest, kind: "choice" }, { currentStateId: S0, actionIds: [] }))).toBe(
            AttemptErrorCode.AnswerInvalid,
        )
    })
})
