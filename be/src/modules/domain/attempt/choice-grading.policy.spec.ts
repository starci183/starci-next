import { Test } from "@nestjs/testing"
import type { LessonActivity } from "@modules/domain/lesson"
import { findEssentialActivity } from "@modules/domain/lesson/lesson-essential.policy"
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

describe("gradeChoice of an opener question, one pick at a time", () => {
    const INSIGHT = { essence: "INSIGHT-ESSENCE", why: "INSIGHT-WHY", interview: "INSIGHT-INTERVIEW" }
    const opener = (): LessonActivity => {
        const found = findEssentialActivity(
            {
                story: { title: "T", body: "B" },
                opener: [
                    {
                        id: "q1",
                        prompt: "Q1?",
                        choices: ["a", "b", "c"],
                        correctIndex: 2,
                        explanation: "RIGHT-WHY",
                        choiceExplanations: ["A-WRONG-WHY", "B-WRONG-WHY", "RIGHT-WHY"],
                        insight: INSIGHT,
                    },
                ],
                source: null,
                invariants: [],
                architecture: null,
                codeWalk: [],
                scenarios: [],
                challenges: [],
            },
            "opener.q1",
        )
        if (found === null) throw new Error("the opener question is not found")
        return found.activity
    }

    it("answers a wrong pick with its own explanation only: the right option and the insight stay hidden", async () => {
        const grade = await build()

        const result = grade(opener(), answerOf({ optionId: "c0" }))

        expect(result).toMatchObject({
            correct: false,
            insight: null,
            score: 0,
            options: [{ optionId: "c0", isCorrect: false, selected: true, explanation: "A-WRONG-WHY" }],
        })
        const text = JSON.stringify(result)
        for (const secret of ["RIGHT-WHY", "B-WRONG-WHY", "INSIGHT", '"c2"']) expect(text).not.toContain(secret)
    })

    it("grades a second wrong pick and then the right one of the same question, each on its own", async () => {
        const grade = await build()
        const activity = opener()

        const second = grade(activity, answerOf({ optionId: "c1" }))
        const right = grade(activity, answerOf({ optionId: "c2" }))

        expect(second).toMatchObject({ correct: false, insight: null, options: [{ explanation: "B-WRONG-WHY" }] })
        expect(right).toMatchObject({
            correct: true,
            score: 1,
            insight: INSIGHT,
        })
        // A right pick solves the question: every option's reason is released, the picked one marked.
        expect(right.options.map((option) => [option.optionId, option.selected, option.explanation])).toEqual([
            ["c0", false, "A-WRONG-WHY"],
            ["c1", false, "B-WRONG-WHY"],
            ["c2", true, "RIGHT-WHY"],
        ])
    })

    it("falls back to the right option's explanation when the question has no insight", async () => {
        const grade = await build()
        const withInsight = opener()
        const activity = {
            ...withInsight,
            options: (withInsight.options ?? []).map((option) => ({
                id: option.id,
                label: option.label,
                explanation: option.explanation,
                isCorrect: option.isCorrect,
            })),
        }

        expect(grade(activity, answerOf({ optionId: "c2" }))).toMatchObject({
            correct: true,
            insight: null,
        })
    })
})
