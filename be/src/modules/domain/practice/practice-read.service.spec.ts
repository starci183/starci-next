import { Test } from "@nestjs/testing"
import { mock, mockEntityManager } from "@starci/jest-preset"
import { PRACTICE_LEARNER, PRACTICE_HIDDEN_MARK, practiceContentOf } from "@tests/fixtures/builders/practice.builder"
import { ENTITLEMENT_SERVICE } from "@modules/domain/entitlement"
import type { EntitlementService } from "@modules/domain/entitlement"
import { LIST_ROWS_MAX, PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { PracticeErrorCode } from "./errors/practice.error"
import { PracticeReadService } from "./practice-read.service"
import { PRACTICE_OPTIONS } from "./practice.decorators"
import type { PracticeOptions } from "./practice.options"
import type { PatternCountRow, ProblemListRow, ProblemRow } from "./persistence/practice.rows"
import {
    SELECT_HINT_STEPS,
    SELECT_PATTERN_COUNTS,
    SELECT_PATTERN_PROBLEMS,
    SELECT_PROBLEM,
    SELECT_STATUS,
} from "./persistence/practice.sql"

const listRow = (slug: string, order: number, status = "unsolved"): ProblemListRow => ({
    problem_id: slug,
    title: slug,
    difficulty: "easy",
    tags: [],
    order_index: order,
    status,
})

const problemRow = (rank: number): ProblemRow => ({
    problem_id: "sum-two",
    version: "v1",
    pattern_id: "arrays",
    order_index: rank,
    difficulty: "easy",
    tags: [],
    time_limit_ms: 2000,
    memory_limit_kb: 262144,
    content: practiceContentOf("sum-two"),
    starter_codes: { cpp: "c", java: "j", javascript: "js", python: "p", typescript: "t" },
    examples: [{ input: "1 2", output: "3" }],
    rank,
    next_slug: null,
})

const build = async (
    queries: ReadonlyArray<readonly [string, unknown]>,
    options: { premium?: boolean; free?: number } = {},
) => {
    const em = mockEntityManager({ query: queries })
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(options.premium ?? false)
    const practiceOptions: PracticeOptions = { freePerPattern: options.free ?? 1 }
    const moduleRef = await Test.createTestingModule({
        providers: [
            PracticeReadService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: em },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            {
                provide: PRACTICE_OPTIONS,
                useValue: practiceOptions,
            },
        ],
    }).compile()
    return { service: moduleRef.get(PracticeReadService), em }
}

const counts: ReadonlyArray<PatternCountRow> = [
    { pattern_id: "strings", problem_count: 5, accepted_count: 2 },
    { pattern_id: "arrays", problem_count: 3, accepted_count: 1 },
]

describe("PracticeReadService patterns", () => {
    it("lists the patterns that have problems in catalog order with the counts and the free ones of the viewer", async () => {
        const { service, em } = await build([[SELECT_PATTERN_COUNTS, counts]])

        const patterns = await service.patterns({ learnerId: PRACTICE_LEARNER, locale: "en" })

        expect(patterns).toEqual([
            { patternId: "arrays", title: "Arrays", problemCount: 3, acceptedCount: 1, freeCount: 1, locked: true },
            { patternId: "strings", title: "Strings", problemCount: 5, acceptedCount: 2, freeCount: 1, locked: true },
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_PATTERN_COUNTS, [PRACTICE_LEARNER])
    })

    it("opens every problem of every pattern for Premium", async () => {
        const { service } = await build([[SELECT_PATTERN_COUNTS, counts]], { premium: true })

        const patterns = await service.patterns({ learnerId: PRACTICE_LEARNER, locale: "vi" })

        expect(patterns.map((pattern) => [pattern.freeCount, pattern.locked])).toEqual([
            [3, false],
            [5, false],
        ])
        expect(patterns[0]?.title).toBe("M\u1ea3ng")
    })

    it("never counts more free problems than a pattern has", async () => {
        const { service } = await build([[SELECT_PATTERN_COUNTS, counts]], { free: 4 })

        const patterns = await service.patterns({ learnerId: PRACTICE_LEARNER, locale: "en" })

        expect(patterns.map((pattern) => [pattern.freeCount, pattern.locked])).toEqual([
            [3, false],
            [4, true],
        ])
    })

    it("answers no pattern when nothing was imported", async () => {
        const { service } = await build([[SELECT_PATTERN_COUNTS, []]])

        await expect(service.patterns({ learnerId: PRACTICE_LEARNER, locale: "en" })).resolves.toEqual([])
    })
})

describe("PracticeReadService problems", () => {
    it("lists the problems of a pattern and locks the ones beyond the free ones", async () => {
        const rows = [listRow("a", 0, "accepted"), listRow("b", 1), listRow("c", 2)]
        const { service, em } = await build([[SELECT_PATTERN_PROBLEMS, rows]])

        const problems = await service.problems({ learnerId: PRACTICE_LEARNER, patternId: "arrays", locale: "en" })

        expect(problems.map((problem) => [problem.slug, problem.locked, problem.status])).toEqual([
            ["a", false, "accepted"],
            ["b", true, "unsolved"],
            ["c", true, "unsolved"],
        ])
        expect(em.query).toHaveBeenCalledWith(SELECT_PATTERN_PROBLEMS, [
            PRACTICE_LEARNER,
            "arrays",
            "en",
            LIST_ROWS_MAX,
        ])
    })

    it("locks nothing for Premium", async () => {
        const { service } = await build([[SELECT_PATTERN_PROBLEMS, [listRow("a", 0), listRow("b", 1)]]], {
            premium: true,
        })

        const problems = await service.problems({ learnerId: PRACTICE_LEARNER, patternId: "arrays", locale: "en" })

        expect(problems.every((problem) => !problem.locked)).toBe(true)
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
    it("opens a free problem with its starter codes, examples, standing and the hint steps revealed", async () => {
        const { service, em } = await build([
            [SELECT_PROBLEM, [problemRow(0)]],
            [SELECT_STATUS, [{ status: "attempted" }]],
            [SELECT_HINT_STEPS, [{ step: 1 }]],
        ])

        const view = await service.problem({ learnerId: PRACTICE_LEARNER, slug: "sum-two", locale: "en" })

        expect(view).toMatchObject({ slug: "sum-two", locked: false, status: "attempted", hintsTotal: 3 })
        expect(view.starterCodes).toHaveLength(5)
        expect(view.examples).toEqual([{ input: "1 2", output: "3" }])
        expect(view.hintsRevealed.map((hint) => hint.step)).toEqual([1])
        expect(em.query).toHaveBeenCalledWith(SELECT_PROBLEM, ["sum-two"])
    })

    it("answers only the statement of a locked problem", async () => {
        const { service } = await build([
            [SELECT_PROBLEM, [problemRow(1)]],
            [SELECT_STATUS, []],
            [SELECT_HINT_STEPS, [{ step: 1 }]],
        ])

        const view = await service.problem({ learnerId: PRACTICE_LEARNER, slug: "sum-two", locale: "vi" })

        expect(view).toMatchObject({
            locked: true,
            status: "unsolved",
            starterCodes: [],
            examples: [],
            hintsRevealed: [],
        })
        expect(view.statementMarkdown).toBe("vi statement sum-two")
    })

    it("opens the same problem for Premium and never leaks a hidden test or a solution", async () => {
        const stored = {
            ...problemRow(1),
            tests: [{ input: PRACTICE_HIDDEN_MARK, output: "x" }],
            solutions: { python: PRACTICE_HIDDEN_MARK },
        }
        const { service } = await build(
            [
                [SELECT_PROBLEM, [stored]],
                [SELECT_STATUS, [{ status: "accepted" }]],
                [SELECT_HINT_STEPS, []],
            ],
            { premium: true },
        )

        const view = await service.problem({ learnerId: PRACTICE_LEARNER, slug: "sum-two", locale: "en" })

        expect(view.locked).toBe(false)
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

describe("PracticeReadService readiness", () => {
    it("counts the accepted problems per pattern in catalog order for hiring readiness", async () => {
        const { service } = await build([[SELECT_PATTERN_COUNTS, counts]])

        await expect(service.readiness({ learnerId: PRACTICE_LEARNER, locale: "en" })).resolves.toEqual([
            { patternId: "arrays", title: "Arrays", problemCount: 3, acceptedCount: 1 },
            { patternId: "strings", title: "Strings", problemCount: 5, acceptedCount: 2 },
        ])
    })
})
