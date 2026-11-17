import { Test } from "@nestjs/testing"
import { mockEntityManager } from "@starci/jest-preset"
import { PRACTICE_LEARNER, PRACTICE_HIDDEN_MARK, practiceContentOf } from "@tests/fixtures/builders/practice.builder"
import { LIST_ROWS_MAX, PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { PracticeErrorCode } from "./errors/practice.error"
import { PRACTICE_PATTERN_IDS } from "./practice-catalog.policy"
import { PracticeReadService } from "./practice-read.service"
import type {
    NextProblemRow,
    PatternCompletionRow,
    PatternCountRow,
    PatternIntroRow,
    PatternLanguageRow,
    ProblemListRow,
    ProblemRow,
    ResumeProblemRow,
} from "./persistence/practice.rows"
import {
    SELECT_HINT_STEPS,
    SELECT_NEXT_PROBLEM,
    SELECT_PATTERN_COMPLETION,
    SELECT_PATTERN_COUNTS,
    SELECT_PATTERN_INTROS,
    SELECT_PATTERN_LANGUAGE,
    SELECT_PATTERN_PROBLEMS,
    SELECT_PROBLEM,
    SELECT_RESUME_PROBLEM,
    SELECT_STATUS,
} from "./persistence/practice.sql"

const listRow = (slug: string, order: number, status = "unsolved", viewed = false): ProblemListRow => ({
    problem_id: slug,
    title: slug,
    difficulty: "easy",
    tags: [],
    order_index: order,
    status,
    solution_revealed: viewed,
    solution_viewed: viewed,
})

const problemRow = (order: number): ProblemRow => ({
    problem_id: "sum-two",
    version: "v1",
    pattern_id: "arrays",
    order_index: order,
    difficulty: "easy",
    tags: [],
    time_limit_ms: 2000,
    memory_limit_kb: 262144,
    content: practiceContentOf("sum-two"),
    starter_codes: { cpp: "c", java: "j", javascript: "js", python: "p", typescript: "t" },
    examples: [{ input: "1 2", output: "3" }],
    next_slug: null,
})

const build = async (queries: ReadonlyArray<readonly [string, unknown]>) => {
    const em = mockEntityManager({ query: queries })
    const moduleRef = await Test.createTestingModule({
        providers: [PracticeReadService, { provide: PRIMARY_ENTITY_MANAGER, useValue: em }],
    }).compile()
    return { service: moduleRef.get(PracticeReadService), em }
}

const counts: ReadonlyArray<PatternCountRow> = [
    { pattern_id: "strings", problem_count: 5, accepted_count: 2 },
    { pattern_id: "arrays", problem_count: 3, accepted_count: 1 },
]

const intros: ReadonlyArray<PatternIntroRow> = [{ pattern_id: "arrays", intro: "Use arrays when order matters." }]

describe("PracticeReadService patterns", () => {
    it("lists the patterns that have problems in catalog order with the counts of the viewer and the intro in the locale", async () => {
        const { service, em } = await build([
            [SELECT_PATTERN_COUNTS, counts],
            [SELECT_PATTERN_INTROS, intros],
        ])

        const patterns = await service.patterns({ learnerId: PRACTICE_LEARNER, locale: "en" })

        expect(patterns).toEqual([
            {
                patternId: "arrays",
                title: "Arrays",
                problemCount: 3,
                acceptedCount: 1,
                intro: "Use arrays when order matters.",
            },
            { patternId: "strings", title: "Strings", problemCount: 5, acceptedCount: 2, intro: "" },
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_PATTERN_COUNTS, [PRACTICE_LEARNER])
        expect(em.query).toHaveBeenCalledWith(SELECT_PATTERN_INTROS, ["en"])
    })

    it("titles the patterns in the asked locale", async () => {
        const { service } = await build([
            [SELECT_PATTERN_COUNTS, counts],
            [SELECT_PATTERN_INTROS, []],
        ])

        const patterns = await service.patterns({ learnerId: PRACTICE_LEARNER, locale: "vi" })

        expect(patterns[0]?.title).toBe("M\u1ea3ng")
    })

    it("answers no pattern when nothing was imported", async () => {
        const { service } = await build([
            [SELECT_PATTERN_COUNTS, []],
            [SELECT_PATTERN_INTROS, []],
        ])

        await expect(service.patterns({ learnerId: PRACTICE_LEARNER, locale: "en" })).resolves.toEqual([])
    })
})

describe("PracticeReadService problems", () => {
    it("lists the problems of a pattern with the standing and the solution flags of the viewer", async () => {
        const rows = [listRow("a", 0, "accepted"), listRow("b", 1, "attempted", true), listRow("c", 2)]
        const { service, em } = await build([[SELECT_PATTERN_PROBLEMS, rows]])

        const problems = await service.problems({ learnerId: PRACTICE_LEARNER, patternId: "arrays", locale: "en" })

        expect(
            problems.map((problem) => [
                problem.slug,
                problem.status,
                problem.solutionRevealed,
                problem.solutionViewedBeforeAccepted,
            ]),
        ).toEqual([
            ["a", "accepted", false, false],
            ["b", "attempted", true, true],
            ["c", "unsolved", false, false],
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_PATTERN_PROBLEMS, [
            PRACTICE_LEARNER,
            "arrays",
            "en",
            LIST_ROWS_MAX,
        ])
    })

    it("refuses an id that is not a pattern without asking the database", async () => {
        const { service, em } = await build([])

        await expect(
            service.problems({ learnerId: PRACTICE_LEARNER, patternId: "nope", locale: "en" }),
        ).rejects.toMatchObject({
            code: PracticeErrorCode.PatternNotFound,
        })

        expect(em.query).not.toHaveBeenCalled()
    })

    it("refuses a pattern that has no problem yet", async () => {
        const { service } = await build([[SELECT_PATTERN_PROBLEMS, []]])

        await expect(
            service.problems({ learnerId: PRACTICE_LEARNER, patternId: "arrays", locale: "en" }),
        ).rejects.toMatchObject({
            code: PracticeErrorCode.PatternNotFound,
        })
    })
})

describe("PracticeReadService problem", () => {
    it("opens a problem with its starter codes, examples, standing and the hint steps revealed", async () => {
        const { service, em } = await build([
            [SELECT_PROBLEM, [problemRow(0)]],
            [SELECT_STATUS, [{ status: "attempted", solution_revealed: false, solution_viewed: false }]],
            [SELECT_HINT_STEPS, [{ step: 1 }]],
        ])

        const view = await service.problem({ learnerId: PRACTICE_LEARNER, slug: "sum-two", locale: "en" })

        expect(view).toMatchObject({
            slug: "sum-two",
            status: "attempted",
            hintsTotal: 3,
            solutionRevealed: false,
            solutionViewedBeforeAccepted: false,
        })
        expect(view.starterCodes).toHaveLength(5)
        expect(view.examples).toEqual([{ input: "1 2", output: "3" }])
        expect(view.hintsRevealed.map((hint) => hint.step)).toEqual([1])
        expect(em.query).toHaveBeenCalledWith(SELECT_PROBLEM, ["sum-two"])
    })

    it("opens a problem at any place of its pattern the same way and flags a solution seen before Accepted", async () => {
        const { service } = await build([
            [SELECT_PROBLEM, [problemRow(7)]],
            [SELECT_STATUS, [{ status: "attempted", solution_revealed: true, solution_viewed: true }]],
            [SELECT_HINT_STEPS, []],
        ])

        const view = await service.problem({ learnerId: PRACTICE_LEARNER, slug: "sum-two", locale: "vi" })

        expect(view).toMatchObject({ solutionRevealed: true, solutionViewedBeforeAccepted: true })
        expect(view.starterCodes).toHaveLength(5)
        expect(view.statementMarkdown).toBe("vi statement sum-two")
    })

    it("answers an unsolved problem with no standing row and never leaks a hidden test or a solution", async () => {
        const stored = {
            ...problemRow(1),
            tests: [{ input: PRACTICE_HIDDEN_MARK, output: "x" }],
            solutions: { python: PRACTICE_HIDDEN_MARK },
            explanations: { vi: PRACTICE_HIDDEN_MARK, en: PRACTICE_HIDDEN_MARK },
        }
        const { service } = await build([
            [SELECT_PROBLEM, [stored]],
            [SELECT_STATUS, []],
            [SELECT_HINT_STEPS, []],
        ])

        const view = await service.problem({ learnerId: PRACTICE_LEARNER, slug: "sum-two", locale: "en" })

        expect(view).toMatchObject({ status: "unsolved", solutionRevealed: false })
        expect(JSON.stringify(view)).not.toContain(PRACTICE_HIDDEN_MARK)
    })

    it("refuses an unknown problem", async () => {
        const { service } = await build([[SELECT_PROBLEM, []]])

        await expect(
            service.problem({ learnerId: PRACTICE_LEARNER, slug: "nope", locale: "en" }),
        ).rejects.toMatchObject({
            code: PracticeErrorCode.ProblemNotFound,
        })
    })
})

const nextRow: NextProblemRow = {
    problem_id: "two-sum",
    title: "Two Sum",
    pattern_id: "arrays",
    position: 2,
    pattern_problem_count: 6,
}
const resumeRow: ResumeProblemRow = {
    problem_id: "three-sum",
    title: "Three Sum",
    pattern_id: "twoPointers",
    attempts: 3,
    last_verdict: "wrong-answer",
    last_tests: [
        { index: 0, passed: true, status: "Accepted", timeMs: 1, memoryKb: 1, example: null },
        { index: 1, passed: false, status: "Wrong Answer", timeMs: 1, memoryKb: 1, example: null },
    ],
}

describe("PracticeReadService next", () => {
    it("answers the first problem not accepted in the catalog order and the problem in progress", async () => {
        const { service, em } = await build([
            [SELECT_NEXT_PROBLEM, [nextRow]],
            [SELECT_RESUME_PROBLEM, [resumeRow]],
        ])

        const view = await service.next({ learnerId: PRACTICE_LEARNER, patternId: null, locale: "en" })

        expect(view).toEqual({
            next: {
                slug: "two-sum",
                title: "Two Sum",
                patternId: "arrays",
                patternTitle: "Arrays",
                position: 2,
                patternProblemCount: 6,
            },
            resume: {
                slug: "three-sum",
                title: "Three Sum",
                patternId: "twoPointers",
                patternTitle: "Two pointers",
                attempts: 3,
                lastVerdict: "wrong-answer",
                failedTestIndex: 1,
            },
        })
        expect(em.query).toHaveBeenCalledWith(SELECT_NEXT_PROBLEM, [PRACTICE_LEARNER, null, "en", PRACTICE_PATTERN_IDS])
        expect(em.query).toHaveBeenCalledWith(SELECT_RESUME_PROBLEM, [PRACTICE_LEARNER, null, "en"])
    })

    it("answers nothing next once everything is accepted and nothing to resume", async () => {
        const { service } = await build([
            [SELECT_NEXT_PROBLEM, []],
            [SELECT_RESUME_PROBLEM, []],
        ])

        await expect(service.next({ learnerId: PRACTICE_LEARNER, patternId: null, locale: "vi" })).resolves.toEqual({
            next: null,
            resume: null,
        })
    })
})

describe("PracticeReadService next of one pattern", () => {
    it("restricts both to one pattern and names no failed test when every kept test passed", async () => {
        const { service, em } = await build([
            [SELECT_NEXT_PROBLEM, [nextRow]],
            [SELECT_RESUME_PROBLEM, [{ ...resumeRow, last_tests: [], last_verdict: "time-limit-exceeded" }]],
        ])

        const view = await service.next({ learnerId: PRACTICE_LEARNER, patternId: "arrays", locale: "en" })

        expect(view.resume).toMatchObject({ lastVerdict: "time-limit-exceeded", failedTestIndex: null })
        expect(em.query).toHaveBeenCalledWith(SELECT_RESUME_PROBLEM, [PRACTICE_LEARNER, "arrays", "en"])
    })

    it("refuses an id that is not a pattern without asking the database", async () => {
        const { service, em } = await build([])

        await expect(
            service.next({ learnerId: PRACTICE_LEARNER, patternId: "nope", locale: "en" }),
        ).rejects.toMatchObject({ code: PracticeErrorCode.PatternNotFound })

        expect(em.query).not.toHaveBeenCalled()
    })
})

describe("PracticeReadService readiness", () => {
    it("counts the accepted problems per pattern in catalog order for hiring readiness", async () => {
        const { service } = await build([[SELECT_PATTERN_COUNTS, counts]])

        await expect(service.readiness({ learnerId: PRACTICE_LEARNER, locale: "en" })).resolves.toEqual([
            { patternId: "arrays", title: "Arrays", problemCount: 3, acceptedCount: 1 },
            { patternId: "strings", title: "Strings", problemCount: 5, acceptedCount: 2 },
        ])
    })
})

describe("PracticeReadService completion", () => {
    const row: PatternCompletionRow = { pattern_id: "arrays", problem_count: 3, accepted_count: 3, viewed_count: 1 }
    const language: PatternLanguageRow = { language: "typescript" }

    it("counts what the learner accepted and viewed in a pattern and names the language most were solved in", async () => {
        const { service, em } = await build([
            [SELECT_PATTERN_COMPLETION, [row]],
            [SELECT_PATTERN_LANGUAGE, [language]],
        ])

        await expect(
            service.completion({ learnerId: PRACTICE_LEARNER, patternId: "arrays", locale: "en" }),
        ).resolves.toEqual({
            patternId: "arrays",
            title: "Arrays",
            problemCount: 3,
            acceptedCount: 3,
            viewedCount: 1,
            language: "TypeScript",
        })
        expect(em.query).toHaveBeenCalledWith(SELECT_PATTERN_COMPLETION, [PRACTICE_LEARNER, "arrays"])
    })

    it("names no language when nothing was accepted", async () => {
        const { service } = await build([
            [SELECT_PATTERN_COMPLETION, [{ ...row, accepted_count: 0, viewed_count: 0 }]],
            [SELECT_PATTERN_LANGUAGE, []],
        ])

        await expect(
            service.completion({ learnerId: PRACTICE_LEARNER, patternId: "arrays", locale: "vi" }),
        ).resolves.toMatchObject({ acceptedCount: 0, language: null })
    })

    it("refuses a pattern that has no live problem", async () => {
        const { service } = await build([
            [SELECT_PATTERN_COMPLETION, []],
            [SELECT_PATTERN_LANGUAGE, []],
        ])

        await expect(
            service.completion({ learnerId: PRACTICE_LEARNER, patternId: "nope", locale: "en" }),
        ).rejects.toMatchObject({ code: PracticeErrorCode.PatternNotFound })
    })
})
