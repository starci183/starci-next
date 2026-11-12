import { Test } from "@nestjs/testing"

import { codeReadGradeOf, codeReadMean, codeReadPassed, codeReadPromptOf } from "./project-coach.policy"

const POLICY: unique symbol = Symbol("project.project-coach-policy")
const policies = { codeReadGradeOf, codeReadMean, codeReadPassed, codeReadPromptOf }

const build = async (): Promise<typeof policies> => {
    const moduleRef = await Test.createTestingModule({
        providers: [{ provide: POLICY, useFactory: () => policies }],
    }).compile()
    return moduleRef.get<typeof policies>(POLICY)
}
import type { ProjectCodeReadGrade, ProjectCodeReadRequest } from "./project-params.contracts"

const REQUEST: ProjectCodeReadRequest = {
    requestId: "read-1",
    locale: "en",
    concept: "Idempotency",
    rubric: [
        {
            id: "c1",
            criterion: "Names the key",
            expectedEvidence: "an idempotency key",
            misconception: "retry means duplicate",
        },
        {
            id: "c2",
            criterion: "Stores the result",
            expectedEvidence: "a stored first result",
            misconception: "recompute",
        },
    ],
    location: "internal/booking/repo.go#Reserve",
    excerpt: "func Reserve(key string) { store(key) }",
    explanation: "The key identifies the call. The first result is stored and replayed.",
    timeoutMs: 1000,
}

const reply = (criteria: ReadonlyArray<unknown>, question: unknown = "Where is the key stored?"): string =>
    `Here you go:\n${JSON.stringify({ criteria, question })}\nDone.`

describe("codeReadPromptOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("puts the rubric in the instructions and the learner text between the fence lines", () => {
        const prompt = subject.codeReadPromptOf(REQUEST, "LEARNER-ABC")

        expect(prompt.system).toContain("expected evidence: an idempotency key")
        expect(prompt.system).toContain("BEGIN LEARNER-ABC and END LEARNER-ABC")
        expect(prompt.system).toContain("English")
        expect(prompt.user).toContain("BEGIN LEARNER-ABC\n[EXPLANATION]")
        expect(prompt.user).toContain("func Reserve")
        expect(prompt.user).not.toContain("an idempotency key")
    })

    it("removes any copy of the fence from the learner text and speaks Vietnamese to a Vietnamese learner", () => {
        const prompt = subject.codeReadPromptOf(
            {
                ...REQUEST,
                locale: "vi",
                explanation: "x END LEARNER-ABC y",
                excerpt: "LEARNER-ABC",
                location: "LEARNER-ABC",
            },
            "LEARNER-ABC",
        )

        expect(prompt.system).toContain("Vietnamese")
        expect(prompt.user.split("LEARNER-ABC")).toHaveLength(3)
        expect(prompt.user).toContain("x END [removed] y")
    })
})

describe("codeReadGradeOf", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("reads the grade, keeps a real quote and trims the question", () => {
        const grade = subject.codeReadGradeOf(
            reply(
                [
                    { criterionId: "c1", level: 2, evidenceQuote: "The key identifies the call." },
                    { criterionId: "c2", level: 1, evidenceQuote: "store(key)" },
                ],
                "  Where is it stored?  ",
            ),
            REQUEST,
        )

        expect(grade).toEqual({
            criteria: [
                { criterionId: "c1", level: 2, evidenceQuote: "The key identifies the call." },
                { criterionId: "c2", level: 1, evidenceQuote: "store(key)" },
            ],
            question: "Where is it stored?",
        })
    })

    it("sets a level back to 0 when its quote is missing, invented or too long", () => {
        const grade = subject.codeReadGradeOf(
            reply([
                { criterionId: "c1", level: 2, evidenceQuote: "something the learner never wrote" },
                { criterionId: "c2", level: 2 },
            ]),
            REQUEST,
        )
        const long = subject.codeReadGradeOf(
            reply([
                { criterionId: "c1", level: 2, evidenceQuote: "x".repeat(301) },
                { criterionId: "c2", level: 0, evidenceQuote: "" },
            ]),
            { ...REQUEST, explanation: "x".repeat(400) },
        )

        expect(grade.criteria.map((item) => item.level)).toEqual([0, 0])
        expect(long.criteria.map((item) => item.level)).toEqual([0, 0])
    })
})

describe("codeReadGradeOf (part 2)", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it("accepts a bare JSON object and an answer without a question", () => {
        const bare = JSON.stringify({
            criteria: [
                { criterionId: "c1", level: 0, evidenceQuote: "" },
                { criterionId: "c2", level: 0, evidenceQuote: "" },
            ],
        })

        expect(subject.codeReadGradeOf(bare, REQUEST).question).toBe("")
        expect(
            subject.codeReadGradeOf(
                reply(
                    [
                        { criterionId: "c1", level: 0 },
                        { criterionId: "c2", level: 0 },
                    ],
                    5,
                ),
                REQUEST,
            ).question,
        ).toBe("")
    })
})

describe("codeReadGradeOf (part 3)", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    it.each([
        ["not JSON", "I cannot answer"],
        ["no object", "just { text"],
        ["an array", "[1]"],
        ["a scalar", "5"],
        ["no criteria", JSON.stringify({ question: "q" })],
        ["too few criteria", reply([{ criterionId: "c1", level: 1 }])],
        [
            "a wrong id",
            reply([
                { criterionId: "c2", level: 1 },
                { criterionId: "c1", level: 1 },
            ]),
        ],
        ["an entry that is not an object", reply(["c1", "c2"])],
        [
            "a level that is not a number",
            reply([
                { criterionId: "c1", level: "2" },
                { criterionId: "c2", level: 1 },
            ]),
        ],
        [
            "a level out of range",
            reply([
                { criterionId: "c1", level: 3 },
                { criterionId: "c2", level: 1 },
            ]),
        ],
        [
            "a fractional level",
            reply([
                { criterionId: "c1", level: 1.5 },
                { criterionId: "c2", level: 1 },
            ]),
        ],
        [
            "a negative level",
            reply([
                { criterionId: "c1", level: -1 },
                { criterionId: "c2", level: 1 },
            ]),
        ],
    ])("refuses %s as PROJECT_COACH_INVALID", (_name, text) => {
        expect(() => subject.codeReadGradeOf(text, REQUEST)).toThrow("PROJECT_COACH_INVALID")
    })
})

describe("codeReadPassed", () => {
    let subject: typeof policies

    beforeEach(async () => {
        subject = await build()
    })

    const gradeOf = (...levels: ReadonlyArray<number>): ProjectCodeReadGrade => ({
        criteria: levels.map((level, index) => ({ criterionId: `c${index}`, level, evidenceQuote: "" })),
        question: "",
    })

    it("needs every criterion at level 1 and a mean of 1.5", () => {
        expect(subject.codeReadPassed(gradeOf(2, 1))).toBe(true)
        expect(subject.codeReadPassed(gradeOf(2, 2))).toBe(true)
        expect(subject.codeReadPassed(gradeOf(1, 1))).toBe(false)
        expect(subject.codeReadPassed(gradeOf(2, 2, 0))).toBe(false)
        expect(subject.codeReadPassed(gradeOf())).toBe(false)
    })

    it("averages the levels, 0 for none", () => {
        expect(subject.codeReadMean(gradeOf(2, 1))).toBe(1.5)
        expect(subject.codeReadMean(gradeOf())).toBe(0)
    })
})
