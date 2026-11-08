import { eachInOrder } from "@modules/platform/primitives"
import { learnersOf } from "../../fixtures/builders/identity.builder"
import { PRACTICE_HIDDEN_MARK, type StoredProblem } from "../../fixtures/builders/practice.builder"
import { JUDGE0_FAKE_MARKERS } from "../../world/fakes/judge0/judge0.client"
import { identityModules } from "../../world/identity-world.options"
import {
    HINT,
    PATTERNS,
    PROBLEM,
    PROBLEMS,
    READINESS,
    RUN,
    SUBMISSION,
    SUBMIT,
    practiceDoors,
    solveInput,
    type PracticeHintBody,
    type PracticePatternBody,
    type PracticeProblemBody,
    type PracticeProblemRowBody,
    type PracticeSubmissionBody,
} from "../../world/practice-doors.client"
import { useTestWorld } from "../../world/use-test-world"

const PROBLEMS_STORED: ReadonlyArray<StoredProblem> = [
    { slug: "sum-one", pattern: "arrays", order: 0 },
    { slug: "sum-two", pattern: "arrays", order: 1 },
    { slug: "sum-three", pattern: "arrays", order: 2 },
    { slug: "stack-one", pattern: "stack", order: 0 },
]

const PLAIN = "print(sum(map(int, input().split())))"

const input = { input: { locale: "en" } }

/**
 * Practice doors (integration): the Luyen code doors of the real core app behind the real session guard, judging through the
 * real Judge0 client against the world's Judge0 fake (steered by markers in the source). It proves the free lock per pattern,
 * that hidden tests and solutions never leave the server, the four verdicts with a per-test summary, the hint ladder, the
 * per-learner rate limit, Premium, the readiness per pattern and the one streak action of a graded submit.
 */
const setup = () => {
    const world = useTestWorld({ modules: identityModules, apps: ["core"] })
    const doors = practiceDoors(world)
    const nextLearner = learnersOf("c3")

    beforeEach(async () => {
        await doors.reset(PROBLEMS_STORED)
    })

    return { world, doors, nextLearner }
}

describe("practice doors, access and reads (integration)", () => {
    const { doors, nextLearner } = setup()

    it("refuses a caller with no session", async () => {
        const answer = await doors.ask(PATTERNS, input)

        expect(answer.data ?? null).toBeNull()
        expect(answer.errors?.[0]?.extensions).toMatchObject({
            code: "IDENTITY_SESSION_REQUIRED",
            kind: "unauthenticated",
        })
    })

    it("lists the patterns and problems with one free problem per pattern for a learner without Premium", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const patterns = await doors.ask<{ practicePatterns: ReadonlyArray<PracticePatternBody> }>(
            PATTERNS,
            input,
            cookie,
        )
        const problems = await doors.ask<{ practiceProblems: ReadonlyArray<PracticeProblemRowBody> }>(
            PROBLEMS,
            { input: { locale: "en", patternId: "arrays" } },
            cookie,
        )

        expect(patterns.data?.practicePatterns).toEqual([
            { patternId: "arrays", problemCount: 3, acceptedCount: 0, freeCount: 1, locked: true },
            { patternId: "stack", problemCount: 1, acceptedCount: 0, freeCount: 1, locked: false },
        ])
        expect(problems.data?.practiceProblems.map((row) => [row.slug, row.locked, row.status])).toEqual([
            ["sum-one", false, "UNSOLVED"],
            ["sum-two", true, "UNSOLVED"],
            ["sum-three", true, "UNSOLVED"],
        ])
    })

    it("opens every problem for Premium", async () => {
        const { cookie } = await doors.signIn(nextLearner(), true)

        const patterns = await doors.ask<{ practicePatterns: ReadonlyArray<PracticePatternBody> }>(
            PATTERNS,
            input,
            cookie,
        )

        expect(patterns.data?.practicePatterns[0]).toMatchObject({ patternId: "arrays", freeCount: 3, locked: false })
    })

    it("refuses an unknown pattern and an unknown problem with their codes", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const pattern = await doors.ask(PROBLEMS, { input: { locale: "en", patternId: "nothing" } }, cookie)
        const problem = await doors.ask(PROBLEM, { input: { locale: "en", slug: "nothing" } }, cookie)

        expect(pattern.errors?.[0]?.extensions).toMatchObject({ code: "PRACTICE_PATTERN_NOT_FOUND", kind: "not-found" })
        expect(problem.errors?.[0]?.extensions).toMatchObject({ code: "PRACTICE_PROBLEM_NOT_FOUND", kind: "not-found" })
    })
})

describe("practice doors, problem reads and locks (integration)", () => {
    const { doors, nextLearner } = setup()

    it("shows a problem with five starter codes and its example and never a hidden test or a solution", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask<{ practiceProblem: PracticeProblemBody }>(
            PROBLEM,
            { input: { locale: "en", slug: "sum-one" } },
            cookie,
        )

        expect(answer.data?.practiceProblem).toMatchObject({
            slug: "sum-one",
            locked: false,
            hintsTotal: 3,
            hintsRevealed: [],
            examples: [{ input: "1 2", output: "3" }],
        })
        expect(answer.data?.practiceProblem.starterCodes.map((code) => code.language).sort()).toEqual([
            "CPP",
            "JAVA",
            "JAVASCRIPT",
            "PYTHON",
            "TYPESCRIPT",
        ])
        expect(JSON.stringify(answer)).not.toContain(PRACTICE_HIDDEN_MARK)
        expect(JSON.stringify(answer)).not.toMatch(/solution/iu)
    })

    it("refuses a run, a submit and a hint on a locked problem to a learner without Premium, and allows Premium", async () => {
        const free = await doors.signIn(nextLearner(), false)
        const premium = await doors.signIn(nextLearner(), true)

        const run = await doors.ask(RUN, solveInput("sum-two", PLAIN), free.cookie)
        const submit = await doors.ask(SUBMIT, solveInput("sum-two", PLAIN), free.cookie)
        const hint = await doors.ask(HINT, { input: { locale: "en", slug: "sum-two", step: 1 } }, free.cookie)
        const allowed = await doors.ask<{ runPractice: PracticeSubmissionBody }>(
            RUN,
            solveInput("sum-two", PLAIN),
            premium.cookie,
        )

        for (const answer of [run, submit, hint])
            expect(answer.errors?.[0]?.extensions).toMatchObject({ code: "PRACTICE_PROBLEM_LOCKED", kind: "forbidden" })
        expect(allowed.data?.runPractice.verdict).toBe("ACCEPTED")
    })
})

describe("practice doors, runs and verdicts (integration)", () => {
    const { doors, nextLearner } = setup()

    it("runs the public example only, shows what the program printed and counts for nothing", async () => {
        const { cookie, subject } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask<{ runPractice: PracticeSubmissionBody }>(
            RUN,
            solveInput("sum-one", PLAIN),
            cookie,
        )

        expect(answer.errors).toBeUndefined()
        expect(answer.data?.runPractice).toMatchObject({
            kind: "RUN",
            verdict: "ACCEPTED",
            passedCount: 1,
            totalCount: 1,
            tests: [
                { index: 0, passed: true, status: "Accepted", example: { input: "1 2", expected: "3", actual: "3" } },
            ],
        })
        expect(await doors.streakActions(subject)).toEqual([])
    })

    it("accepts a submit, summarises every test without revealing the hidden ones, and announces the streak once", async () => {
        const { cookie, subject } = await doors.signIn(nextLearner(), false)

        const submitted = await doors.ask<{ submitPractice: PracticeSubmissionBody }>(
            SUBMIT,
            solveInput("sum-one", PLAIN),
            cookie,
        )
        const submission = submitted.data?.submitPractice
        const read = await doors.ask<{ practiceSubmission: PracticeSubmissionBody }>(
            SUBMISSION,
            { input: { submissionId: submission?.id } },
            cookie,
        )

        expect(submission).toMatchObject({ kind: "SUBMIT", verdict: "ACCEPTED", passedCount: 3, totalCount: 3 })
        expect(submission?.tests.map((test) => [test.index, test.passed, test.example === null])).toEqual([
            [0, true, true],
            [1, true, true],
            [2, true, true],
        ])
        expect(JSON.stringify(submitted)).not.toContain(PRACTICE_HIDDEN_MARK)
        expect(read.data?.practiceSubmission).toEqual(submission)
        expect(await doors.streakActions(subject)).toEqual([
            { action_id: submission?.id, shard: "practice", kind: "graded-attempt" },
        ])
    })

    it("answers Wrong Answer with the failing hidden test marked, the others passed, and still counts it as graded", async () => {
        const { cookie, subject } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask<{ submitPractice: PracticeSubmissionBody }>(
            SUBMIT,
            solveInput("sum-one", `# ${JUDGE0_FAKE_MARKERS.wrongAnswer}\n${PLAIN}`),
            cookie,
        )

        expect(answer.data?.submitPractice).toMatchObject({ verdict: "WRONG_ANSWER", passedCount: 2, totalCount: 3 })
        expect(answer.data?.submitPractice.tests.map((test) => [test.passed, test.status])).toEqual([
            [true, "Accepted"],
            [false, "Wrong Answer"],
            [true, "Accepted"],
        ])
        expect(JSON.stringify(answer)).not.toContain(PRACTICE_HIDDEN_MARK)
        expect(await doors.streakActions(subject)).toHaveLength(1)
    })
})

describe("practice doors, failing judgements (integration)", () => {
    const { world, doors, nextLearner } = setup()

    it("answers Time Limit Exceeded and Compilation Error with the compiler output", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const slow = await doors.ask<{ submitPractice: PracticeSubmissionBody }>(
            SUBMIT,
            solveInput("sum-one", `# ${JUDGE0_FAKE_MARKERS.timeLimit}\n${PLAIN}`),
            cookie,
        )
        const broken = await doors.ask<{ submitPractice: PracticeSubmissionBody }>(
            SUBMIT,
            solveInput("sum-one", `# ${JUDGE0_FAKE_MARKERS.compileError}\n${PLAIN}`),
            cookie,
        )

        expect(slow.data?.submitPractice).toMatchObject({ verdict: "TIME_LIMIT_EXCEEDED", compileOutput: null })
        expect(slow.data?.submitPractice.tests.every((test) => test.status === "Time Limit Exceeded")).toBe(true)
        expect(broken.data?.submitPractice).toMatchObject({ verdict: "COMPILE_ERROR", passedCount: 0 })
        expect(broken.data?.submitPractice.compileOutput).toContain("expected ';'")
    })

    it("waits for a judge that is still working and answers its verdict", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask<{ submitPractice: PracticeSubmissionBody }>(
            SUBMIT,
            solveInput("sum-one", `# ${JUDGE0_FAKE_MARKERS.slow}\n${PLAIN}`),
            cookie,
        )

        expect(answer.data?.submitPractice.verdict).toBe("ACCEPTED")
    })

    it("answers an internal error, not a verdict, when Judge0 is down, and announces nothing to the streak", async () => {
        const { cookie, subject } = await doors.signIn(nextLearner(), false)
        await world.fake.judge0?.failNext({ status: 503, times: 1 })

        const answer = await doors.ask<{ submitPractice: PracticeSubmissionBody }>(
            SUBMIT,
            solveInput("sum-one", PLAIN),
            cookie,
        )

        expect(answer.data?.submitPractice).toMatchObject({
            verdict: "INTERNAL_ERROR",
            failureCode: "JUDGE0_UNAVAILABLE",
        })
        expect(await doors.streakActions(subject)).toEqual([])
    })

    it("refuses an empty source", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)

        const answer = await doors.ask(RUN, solveInput("sum-one", "   "), cookie)

        expect(answer.errors?.[0]?.extensions).toMatchObject({ code: "PRACTICE_SOURCE_EMPTY", kind: "invalid" })
    })
})

describe("practice doors, hints and the rate limit (integration)", () => {
    const { doors, nextLearner } = setup()

    it("opens the hint ladder in order, remembers it per learner and writes no code", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)
        const other = await doors.signIn(nextLearner(), false)
        const ask = (step: number, session = cookie) =>
            doors.ask<{ revealPracticeHint: PracticeHintBody }>(
                HINT,
                { input: { locale: "en", slug: "sum-one", step } },
                session,
            )

        const skipped = await ask(2)
        const first = await ask(1)
        const second = await ask(2)
        const again = await ask(1)
        const third = await ask(3)
        const problem = await doors.ask<{ practiceProblem: PracticeProblemBody }>(
            PROBLEM,
            { input: { locale: "en", slug: "sum-one" } },
            cookie,
        )
        const strangerProblem = await doors.ask<{ practiceProblem: PracticeProblemBody }>(
            PROBLEM,
            { input: { locale: "en", slug: "sum-one" } },
            other.cookie,
        )

        expect(skipped.errors?.[0]?.extensions).toMatchObject({ code: "PRACTICE_HINT_OUT_OF_ORDER" })
        expect(first.data?.revealPracticeHint).toMatchObject({ step: 1, markdown: "en hint 1" })
        expect(second.data?.revealPracticeHint.step).toBe(2)
        expect(again.data?.revealPracticeHint.step).toBe(1)
        expect(third.data?.revealPracticeHint.step).toBe(3)
        expect(problem.data?.practiceProblem.hintsRevealed.map((hint) => hint.step)).toEqual([1, 2, 3])
        expect(strangerProblem.data?.practiceProblem.hintsRevealed).toEqual([])
    })

    it("limits one learner to the submissions per minute and answers the rate-limited kind", async () => {
        const { cookie } = await doors.signIn(nextLearner(), false)
        await eachInOrder([1, 2, 3, 4, 5], async () => {
            const answer = await doors.ask<{ runPractice: PracticeSubmissionBody }>(
                RUN,
                solveInput("sum-one", PLAIN),
                cookie,
            )
            expect(answer.data?.runPractice.verdict).toBe("ACCEPTED")
        })

        const limited = await doors.ask(RUN, solveInput("sum-one", PLAIN), cookie)
        const other = await doors.signIn(nextLearner(), false)
        const unaffected = await doors.ask<{ runPractice: PracticeSubmissionBody }>(
            RUN,
            solveInput("sum-one", PLAIN),
            other.cookie,
        )

        expect(limited.errors?.[0]?.extensions).toMatchObject({ code: "PRACTICE_RATE_LIMITED", kind: "rate-limited" })
        expect(unaffected.data?.runPractice.verdict).toBe("ACCEPTED")
    })
})

describe("practice doors, readiness and ownership (integration)", () => {
    const { doors, nextLearner } = setup()

    it("counts the accepted problems per pattern for readiness and marks the problem accepted or attempted", async () => {
        const { cookie } = await doors.signIn(nextLearner(), true)
        await doors.ask(SUBMIT, solveInput("sum-one", PLAIN), cookie)
        await doors.ask(SUBMIT, solveInput("sum-one", PLAIN), cookie)
        await doors.ask(SUBMIT, solveInput("sum-two", `# ${JUDGE0_FAKE_MARKERS.wrongAnswer}\n${PLAIN}`), cookie)

        const readiness = await doors.ask<{
            practiceReadiness: ReadonlyArray<{ patternId: string; problemCount: number; acceptedCount: number }>
        }>(READINESS, input, cookie)
        const problems = await doors.ask<{ practiceProblems: ReadonlyArray<PracticeProblemRowBody> }>(
            PROBLEMS,
            { input: { locale: "en", patternId: "arrays" } },
            cookie,
        )

        expect(readiness.data?.practiceReadiness).toEqual([
            { patternId: "arrays", problemCount: 3, acceptedCount: 1 },
            { patternId: "stack", problemCount: 1, acceptedCount: 0 },
        ])
        expect(problems.data?.practiceProblems.map((row) => [row.slug, row.status])).toEqual([
            ["sum-one", "ACCEPTED"],
            ["sum-two", "ATTEMPTED"],
            ["sum-three", "UNSOLVED"],
        ])
    })

    it("does not show the submission of one learner to another", async () => {
        const owner = await doors.signIn(nextLearner(), false)
        const stranger = await doors.signIn(nextLearner(), false)
        const submitted = await doors.ask<{ runPractice: PracticeSubmissionBody }>(
            RUN,
            solveInput("sum-one", PLAIN),
            owner.cookie,
        )

        const read = await doors.ask(
            SUBMISSION,
            { input: { submissionId: submitted.data?.runPractice.id } },
            stranger.cookie,
        )

        expect(read.errors?.[0]?.extensions).toMatchObject({ code: "PRACTICE_SUBMISSION_NOT_FOUND", kind: "not-found" })
    })
})
