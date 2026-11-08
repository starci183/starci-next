import { Test } from "@nestjs/testing"
import { PRACTICE_HIDDEN_MARK, practiceContentOf } from "@tests/fixtures/builders/practice.builder"
import * as subject from "./practice-view.mapper"
import type { PracticeStarterCodes } from "./practice.contracts"
import type { ProblemListRow, ProblemRow, SubmissionRow } from "./persistence/practice.rows"

const SUBJECT: unique symbol = Symbol("practice.practice-view.mapper")

const STARTERS: PracticeStarterCodes = {
    cpp: "starter cpp",
    java: "starter java",
    javascript: "starter javascript",
    python: "starter python",
    typescript: "starter typescript",
}

const problemRow = (overrides: Partial<ProblemRow> = {}): ProblemRow => ({
    problem_id: "sum-two",
    version: "v1",
    pattern_id: "arrays",
    order_index: 0,
    difficulty: "easy",
    tags: ["arrays"],
    time_limit_ms: 2000,
    memory_limit_kb: 262144,
    content: practiceContentOf("sum-two"),
    starter_codes: STARTERS,
    examples: [{ input: "1 2", output: "3" }],
    rank: 0,
    next_slug: "next-one",
    ...overrides,
})

const submissionRow = (overrides: Partial<SubmissionRow> = {}): SubmissionRow => ({
    submission_id: "sub-1",
    learner_id: "learner-1",
    problem_id: "sum-two",
    problem_version: "v1",
    language: "python",
    kind: "submit",
    verdict: "accepted",
    failure_code: null,
    compile_output: null,
    tests: [],
    passed_count: 3,
    total_count: 3,
    time_ms: 12,
    memory_kb: 3000,
    created_at: new Date("2026-11-08T10:00:00.000Z"),
    ...overrides,
})

describe("statusOf", () => {
    let statusOf: typeof subject.statusOf

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ statusOf } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("keeps accepted and attempted and treats anything else as unsolved", () => {
        expect(statusOf("accepted")).toBe("accepted")
        expect(statusOf("attempted")).toBe("attempted")
        expect(statusOf("weird")).toBe("unsolved")
        expect(statusOf(undefined)).toBe("unsolved")
    })
})

describe("toProblemItemView", () => {
    let toProblemItemView: typeof subject.toProblemItemView

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ toProblemItemView } = moduleRef.get<typeof subject>(SUBJECT))
    })

    const row: ProblemListRow = {
        problem_id: "sum-two",
        title: "Sum Two",
        difficulty: "hard",
        tags: ["math"],
        order_index: 4,
        status: "attempted",
    }

    it("maps a list row with its lock", () => {
        expect(toProblemItemView(row, true)).toEqual({
            slug: "sum-two",
            title: "Sum Two",
            difficulty: "hard",
            tags: ["math"],
            status: "attempted",
            locked: true,
            orderIndex: 4,
        })
    })

    it("reads an unknown difficulty as medium", () => {
        expect(toProblemItemView({ ...row, difficulty: "odd" }, false).difficulty).toBe("medium")
    })
})

describe("toProblemView", () => {
    let toProblemView: typeof subject.toProblemView

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ toProblemView } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("opens an unlocked problem with starter codes, examples and only the hint steps the learner revealed", () => {
        const view = toProblemView(problemRow(), "en", false, "unsolved", [1, 2])

        expect(view).toMatchObject({
            slug: "sum-two",
            title: "en sum-two",
            patternId: "arrays",
            patternTitle: "Arrays",
            statementMarkdown: "en statement sum-two",
            locked: false,
            hintsTotal: 3,
            nextSlug: "next-one",
            examples: [{ input: "1 2", output: "3" }],
        })
        expect(view.starterCodes.map((code) => code.language).sort()).toEqual([
            "cpp",
            "java",
            "javascript",
            "python",
            "typescript",
        ])
        expect(view.hintsRevealed.map((hint) => hint.step)).toEqual([1, 2])
    })

    it("answers the statement of a locked problem and nothing a run needs, hints included", () => {
        const view = toProblemView(problemRow(), "vi", true, "unsolved", [1])

        expect(view.locked).toBe(true)
        expect(view.statementMarkdown).toBe("vi statement sum-two")
        expect(view.starterCodes).toEqual([])
        expect(view.examples).toEqual([])
        expect(view.hintsRevealed).toEqual([])
        expect(view.hintsTotal).toBe(3)
    })

    it("never carries a hidden test or a solution", () => {
        const stored = {
            ...problemRow(),
            tests: [{ input: PRACTICE_HIDDEN_MARK, output: "x" }],
            solutions: { python: PRACTICE_HIDDEN_MARK },
        }

        expect(JSON.stringify(toProblemView(stored, "en", false, "accepted", [1, 2, 3]))).not.toContain(
            PRACTICE_HIDDEN_MARK,
        )
    })
})

describe("toSubmissionView", () => {
    let toSubmissionView: typeof subject.toSubmissionView

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            providers: [{ provide: SUBJECT, useFactory: () => subject }],
        }).compile()
        ;({ toSubmissionView } = moduleRef.get<typeof subject>(SUBJECT))
    })

    it("maps a stored submission", () => {
        expect(toSubmissionView(submissionRow())).toEqual({
            id: "sub-1",
            slug: "sum-two",
            language: "python",
            kind: "submit",
            verdict: "accepted",
            compileOutput: null,
            failureCode: null,
            tests: [],
            passedCount: 3,
            totalCount: 3,
            timeMs: 12,
            memoryKb: 3000,
            createdAt: new Date("2026-11-08T10:00:00.000Z"),
        })
    })

    it("reads a run as a run and any other kind as a submit", () => {
        expect(toSubmissionView(submissionRow({ kind: "run" })).kind).toBe("run")
        expect(toSubmissionView(submissionRow({ kind: "other" })).kind).toBe("submit")
    })

    it("falls back to an internal error for an unknown verdict and to python for an unknown language", () => {
        const view = toSubmissionView(submissionRow({ verdict: "mystery", language: "cobol" }))

        expect(view.verdict).toBe("internal-error")
        expect(view.language).toBe("python")
    })

    it("keeps the verdicts the judge gives", () => {
        expect(toSubmissionView(submissionRow({ verdict: "time-limit-exceeded" })).verdict).toBe("time-limit-exceeded")
        expect(toSubmissionView(submissionRow({ verdict: "queued" })).verdict).toBe("queued")
    })
})
