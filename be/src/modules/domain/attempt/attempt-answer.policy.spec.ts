import { Test } from "@nestjs/testing"
import { answerOf, bareActivityOf, codeOf } from "@tests/fixtures/builders/attempt.builder"
import {
    choiceActivityOf,
    exerciseActivityOf,
    explainActivityOf,
    retrievalActivityOf,
    simulationActivityOf,
} from "@tests/fixtures/builders/lesson.builder"
import { attemptKindOf, attemptPhaseOf, normalizeAnswer } from "./attempt-answer.policy"
import type { AttemptServerActivity } from "./attempt.contracts"
import { AttemptErrorCode } from "./errors/attempt.error"

const ANSWER_POLICY: unique symbol = Symbol("attempt.answer-policy")
const policy = { attemptKindOf, attemptPhaseOf, normalizeAnswer }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: ANSWER_POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get<typeof policy>(ANSWER_POLICY)
}

const invalid = AttemptErrorCode.AnswerInvalid
const unsupported = AttemptErrorCode.ActivityUnsupported

describe("attemptKindOf", () => {
    it.each([
        [choiceActivityOf("vi"), "choice"],
        [simulationActivityOf("vi"), "simulation"],
        [explainActivityOf("vi"), "explain"],
        [exerciseActivityOf("vi"), "exercise"],
        [bareActivityOf({ kind: "choice" }), "choice"],
    ] as const)("answers the kind of a supported activity", async (activity, kind) => {
        const { attemptKindOf: kindOf } = await build()

        expect(kindOf(activity)).toBe(kind)
    })

    it.each([
        retrievalActivityOf("vi"),
        { ...explainActivityOf("vi"), rubric: [] },
        bareActivityOf({ kind: "exercise" }),
    ])("refuses a review activity and a written activity without a rubric", async (activity) => {
        const { attemptKindOf: kindOf } = await build()

        expect(codeOf(() => kindOf(activity))).toBe(unsupported)
    })
})

describe("attemptPhaseOf", () => {
    const found = (phase: AttemptServerActivity["phase"]): AttemptServerActivity => ({
        activity: choiceActivityOf("vi"),
        phase,
    })

    it("answers the phase of the section and refuses the review phase", async () => {
        const { attemptPhaseOf: phaseOf } = await build()

        expect(phaseOf(found("predict"))).toBe("predict")
        expect(codeOf(() => phaseOf(found("retrieval")))).toBe(unsupported)
    })
})

describe("normalizeAnswer for a choice", () => {
    it("keeps only the picked option, whatever else was sent", async () => {
        const { normalizeAnswer: normalize } = await build()
        const answer = answerOf({ optionId: "demo--predict--2", text: "ignored", actionIds: ["a"] })

        expect(normalize(choiceActivityOf("vi"), "choice", answer)).toEqual(answerOf({ optionId: "demo--predict--2" }))
    })

    it.each([answerOf(), answerOf({ optionId: "demo--predict--9" })])(
        "refuses a missing or unlisted option",
        async (answer) => {
            const { normalizeAnswer: normalize } = await build()

            expect(codeOf(() => normalize(choiceActivityOf("vi"), "choice", answer))).toBe(invalid)
        },
    )

    it("treats an activity without options as having no option to pick", async () => {
        const { normalizeAnswer: normalize } = await build()
        const answer = answerOf({ optionId: "demo--predict--1" })

        expect(codeOf(() => normalize(bareActivityOf({ kind: "choice" }), "choice", answer))).toBe(invalid)
    })
})

describe("normalizeAnswer for a simulation", () => {
    it("keeps the path, the reached state and the trimmed debrief", async () => {
        const { normalizeAnswer: normalize } = await build()
        const answer = answerOf({
            actionIds: ["demo--explore--a1"],
            reachedStateId: "demo--explore--s1",
            debrief: "  because  ",
            optionId: "ignored",
        })

        expect(normalize(simulationActivityOf("vi"), "simulation", answer)).toEqual(
            answerOf({ actionIds: ["demo--explore--a1"], reachedStateId: "demo--explore--s1", debrief: "because" }),
        )
    })

    it("accepts a path of no actions and no debrief", async () => {
        const { normalizeAnswer: normalize } = await build()
        const answer = answerOf({ reachedStateId: "demo--explore--s0", debrief: "   " })

        expect(normalize(simulationActivityOf("vi"), "simulation", answer)).toEqual(
            answerOf({ actionIds: [], reachedStateId: "demo--explore--s0" }),
        )
    })

    it("refuses an answer that names no reached state", async () => {
        const { normalizeAnswer: normalize } = await build()

        expect(codeOf(() => normalize(simulationActivityOf("vi"), "simulation", answerOf()))).toBe(invalid)
    })
})

describe("normalizeAnswer for a written answer", () => {
    const files = [{ relativePath: "log.txt", content: "red" }]

    it("keeps the trimmed text of an explanation and drops the files", async () => {
        const { normalizeAnswer: normalize } = await build()
        const answer = answerOf({ text: "  it lags  ", files })

        expect(normalize(explainActivityOf("vi"), "explain", answer)).toEqual(answerOf({ text: "it lags" }))
    })

    it("keeps the files of an exercise, or none", async () => {
        const { normalizeAnswer: normalize } = await build()

        expect(normalize(exerciseActivityOf("vi"), "exercise", answerOf({ text: "done", files }))).toEqual(
            answerOf({ text: "done", files }),
        )
        expect(normalize(exerciseActivityOf("vi"), "exercise", answerOf({ text: "done" }))).toEqual(
            answerOf({ text: "done", files: [] }),
        )
    })

    it.each([answerOf(), answerOf({ text: "   " })])("refuses an answer with no text", async (answer) => {
        const { normalizeAnswer: normalize } = await build()

        expect(codeOf(() => normalize(explainActivityOf("vi"), "explain", answer))).toBe(invalid)
    })
})
