import { Test } from "@nestjs/testing"
import { answerOf, bareActivityOf } from "@tests/fixtures/builders/attempt.builder"
import { SECRET, choiceActivityOf } from "@tests/fixtures/builders/lesson.builder"
import { gradeChoice } from "./choice-grading.policy"

const CHOICE_POLICY: unique symbol = Symbol("attempt.choice-policy")

const build = async (): Promise<typeof gradeChoice> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: CHOICE_POLICY, useFactory: () => gradeChoice }],
    }).compile()
    return moduleRef.get<typeof gradeChoice>(CHOICE_POLICY)
}

describe("gradeChoice", () => {
    it("grades the right option correct and releases every explanation", async () => {
        const grade = await build()

        const result = grade(choiceActivityOf("vi"), answerOf({ optionId: "demo--predict--1" }))

        expect(result).toEqual({
            isDiagnostic: false,
            correct: true,
            options: [
                { optionId: "demo--predict--1", isCorrect: true, selected: true, explanation: `${SECRET} right` },
                { optionId: "demo--predict--2", isCorrect: false, selected: false, explanation: `${SECRET} wrong` },
                {
                    optionId: "demo--predict--3",
                    isCorrect: false,
                    selected: false,
                    explanation: `${SECRET} also wrong`,
                },
            ],
            success: null,
            reachedStateId: null,
            criteria: [],
            score: 1,
            maxScore: 1,
        })
    })

    it("grades a wrong option incorrect with no points", async () => {
        const grade = await build()

        const result = grade(choiceActivityOf("vi"), answerOf({ optionId: "demo--predict--2" }))

        expect(result.correct).toBe(false)
        expect(result.score).toBe(0)
        expect(result.options.map((option) => option.selected)).toEqual([false, true, false])
    })

    it("marks a diagnostic choice and grades an activity without options as wrong", async () => {
        const grade = await build()
        const activity = bareActivityOf({ kind: "choice", isDiagnostic: true })

        const result = grade(activity, answerOf({ optionId: "demo--predict--1" }))

        expect(result).toMatchObject({ isDiagnostic: true, correct: false, options: [], score: 0, maxScore: 1 })
    })
})
