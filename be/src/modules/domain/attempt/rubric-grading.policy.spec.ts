import { Test } from "@nestjs/testing"
import {
    WRITTEN_ANSWER,
    answerOf,
    bareActivityOf,
    codeOf,
    coachGradeOf,
} from "@tests/fixtures/builders/attempt.builder"
import { SECRET, exerciseActivityOf, explainActivityOf } from "@tests/fixtures/builders/lesson.builder"
import type { CoachCriterionGrade } from "./attempt.contracts"
import { AttemptErrorCode } from "./errors/attempt.error"
import { coachRubricOf, gradeRubric } from "./rubric-grading.policy"

const RUBRIC_POLICY: unique symbol = Symbol("attempt.rubric-policy")
const policy = { coachRubricOf, gradeRubric }

const build = async (): Promise<typeof policy> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: RUBRIC_POLICY, useFactory: () => policy }],
    }).compile()
    return moduleRef.get<typeof policy>(RUBRIC_POLICY)
}

const C1 = "demo--interview--c1"
const C2 = "demo--interview--c2"
const QUOTE_1 = "the read model lags"
const QUOTE_2 = "eventual consistency"

const written = answerOf({ text: WRITTEN_ANSWER })
const gradeOf = (...criteria: Array<CoachCriterionGrade>) => ({ criteria })
const first: CoachCriterionGrade = { criterionId: C1, level: 2, evidenceQuote: QUOTE_1 }
const second: CoachCriterionGrade = { criterionId: C2, level: 1, evidenceQuote: QUOTE_2 }
const invalid = AttemptErrorCode.CoachInvalid

describe("coachRubricOf", () => {
    it("hands the coach every criterion with the evidence only the grader may see", async () => {
        const { coachRubricOf: rubricOf } = await build()

        expect(rubricOf(explainActivityOf("vi"))).toEqual([
            {
                id: C1,
                criterion: "vi: Mechanism",
                expectedEvidence: `${SECRET} evidence one`,
                misconception: `${SECRET} misconception one`,
                maxScore: 2,
            },
            {
                id: C2,
                criterion: "vi: Limits",
                expectedEvidence: `${SECRET} evidence two`,
                misconception: `${SECRET} misconception two`,
                maxScore: 3,
            },
        ])
    })

    it("hands the coach an empty rubric for an activity that has none", async () => {
        const { coachRubricOf: rubricOf } = await build()

        expect(rubricOf(bareActivityOf())).toEqual([])
    })
})

describe("gradeRubric of a grade that fits the rubric", () => {
    it("turns it into the result, in rubric order, with points by level", async () => {
        const { gradeRubric: grade } = await build()

        const result = grade(explainActivityOf("vi"), written, coachGradeOf())

        expect(result).toEqual({
            isDiagnostic: true,
            correct: null,
            options: [],
            success: null,
            reachedStateId: null,
            criteria: [
                { criterionId: C1, criterion: "vi: Mechanism", level: 2, evidenceQuote: QUOTE_1, maxScore: 2 },
                { criterionId: C2, criterion: "vi: Limits", level: 1, evidenceQuote: QUOTE_2, maxScore: 3 },
            ],
            score: 3.5,
            maxScore: 5,
        })
    })

    it("keeps the rubric order when the coach lists the criteria in another order", async () => {
        const { gradeRubric: grade } = await build()

        const result = grade(explainActivityOf("vi"), written, gradeOf(second, first))

        expect(result.criteria.map((entry) => entry.criterionId)).toEqual([C1, C2])
    })

    it("finds a quote with other case and spacing in the answer", async () => {
        const { gradeRubric: grade } = await build()
        const spaced = gradeOf(
            { criterionId: C1, level: 2, evidenceQuote: "  The   READ model\nlags " },
            { criterionId: C2, level: 0, evidenceQuote: "" },
        )

        const result = grade(explainActivityOf("vi"), written, spaced)

        expect(result.criteria.map((entry) => entry.evidenceQuote)).toEqual(["The   READ model\nlags", ""])
        expect(result.score).toBe(2)
    })

    it("lets a level 0 criterion carry a quote the answer does not hold", async () => {
        const { gradeRubric: grade } = await build()
        const none = gradeOf(
            { criterionId: C1, level: 0, evidenceQuote: "nothing of the sort" },
            { criterionId: C2, level: 0, evidenceQuote: "" },
        )

        expect(grade(explainActivityOf("vi"), written, none).score).toBe(0)
    })

    it("holds no points for an activity without a rubric", async () => {
        const { gradeRubric: grade } = await build()

        expect(grade(bareActivityOf(), written, gradeOf())).toMatchObject({ criteria: [], score: 0, maxScore: 0 })
    })
})

describe("gradeRubric of an exercise", () => {
    const practice: CoachCriterionGrade = {
        criterionId: "demo--practice--c1",
        level: 2,
        evidenceQuote: "red then green",
    }

    it("also finds a quote in the files and marks a non-diagnostic result", async () => {
        const { gradeRubric: grade } = await build()
        const answer = answerOf({
            text: "see the log",
            files: [{ relativePath: "log.txt", content: "RED then green" }],
        })

        const result = grade(exerciseActivityOf("vi"), answer, gradeOf(practice))

        expect(result).toMatchObject({ isDiagnostic: false, score: 2, maxScore: 2 })
    })

    it("reads an answer with no text as an empty source", async () => {
        const { gradeRubric: grade } = await build()

        expect(
            grade(exerciseActivityOf("vi"), answerOf(), gradeOf({ ...practice, level: 0, evidenceQuote: "" })).score,
        ).toBe(0)
    })
})

describe("gradeRubric of a grade the rubric refuses", () => {
    it.each([
        ["a missing criterion", gradeOf(first)],
        ["an extra criterion", gradeOf(first, second, first)],
        ["a duplicate criterion", gradeOf(first, first)],
        ["a criterion the rubric does not hold", gradeOf(first, { ...second, criterionId: "demo--other" })],
        ["a level below 0", gradeOf({ ...first, level: -1 }, second)],
        ["a level above 2", gradeOf({ ...first, level: 3 }, second)],
        ["a level that is not whole", gradeOf({ ...first, level: 1.5 }, second)],
        ["a level that is not a number", gradeOf({ ...first, level: Number.NaN }, second)],
        ["an empty quote above level 0", gradeOf({ ...first, evidenceQuote: "" }, second)],
        ["a blank quote above level 0", gradeOf({ ...first, evidenceQuote: "   " }, second)],
        ["a quote the learner never wrote", gradeOf({ ...first, evidenceQuote: "words nobody wrote" }, second)],
        ["a quote longer than the limit", gradeOf({ ...first, level: 0, evidenceQuote: "x".repeat(601) }, second)],
    ])("refuses %s", async (_name, grade) => {
        const { gradeRubric: gradeIt } = await build()

        expect(codeOf(() => gradeIt(explainActivityOf("vi"), written, grade))).toBe(invalid)
    })
})
