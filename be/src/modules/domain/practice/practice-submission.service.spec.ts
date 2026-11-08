import { Test } from "@nestjs/testing"
import { FakeClock, fakeTransaction, mock, mockEntityManager } from "@starci/jest-preset"
import { PRACTICE_LEARNER, PRACTICE_HIDDEN_MARK } from "@tests/fixtures/builders/practice.builder"
import { ENTITLEMENT_SERVICE } from "@modules/domain/entitlement"
import type { EntitlementService } from "@modules/domain/entitlement"
import { JUDGE0_GATEWAY, Judge0Error, Judge0ErrorCode } from "@modules/integrations/judge0"
import type { Judge0CaseResult, Judge0Gateway } from "@modules/integrations/judge0"
import { isRecord } from "@modules/platform/primitives"
import { CLOCK } from "@modules/platform/clock"
import { PRIMARY_ENTITY_MANAGER } from "@modules/platform/database"
import { LOGGER } from "@modules/platform/logging"
import type { Logger } from "@modules/platform/logging"
import { TIMER } from "@modules/platform/retry"
import type { Timer } from "@modules/platform/retry"
import { PracticeErrorCode } from "./errors/practice.error"
import { PracticeJudgeLanesService } from "./practice-judge-lanes.service"
import { PracticeSubmissionService } from "./practice-submission.service"
import { PRACTICE_STREAK, type PracticeStreakPort } from "./practice-streak.port"
import { PRACTICE_OPTIONS } from "./practice.decorators"
import { PracticeLogEvent } from "./practice.log-events"
import type { PracticeOptions } from "./practice.options"
import type { JudgingRow, RateRow, SubmissionRow } from "./persistence/practice.rows"
import {
    CLAIM_SUBMISSION,
    COMPLETE_SUBMISSION,
    FAIL_STALE,
    INSERT_SUBMISSION,
    LOCK_LEARNER,
    SELECT_JUDGING,
    SELECT_RATE,
    SELECT_SUBMISSION,
} from "./persistence/practice.sql"

const NOW = new Date("2026-11-08T10:00:00.000Z")
const MINUTE_AGO = new Date("2026-11-08T09:59:00.000Z")
const STALE = new Date("2026-11-08T09:57:00.000Z")
const SUBMISSION = "sub-1"

const problemRow = (overrides: Partial<JudgingRow> = {}): JudgingRow => ({
    problem_id: "sum-two",
    version: "v1",
    pattern_id: "arrays",
    time_limit_ms: 2000,
    memory_limit_kb: 262144,
    examples: [{ input: "1 2", output: "3" }],
    tests: [
        { input: `1 1 ${PRACTICE_HIDDEN_MARK}`, output: "2" },
        { input: "2 2", output: "4" },
    ],
    rank: 0,
    ...overrides,
})

const storedRow = (overrides: Partial<SubmissionRow> = {}): SubmissionRow => ({
    submission_id: SUBMISSION,
    learner_id: PRACTICE_LEARNER,
    problem_id: "sum-two",
    problem_version: "v1",
    language: "python",
    kind: "submit",
    verdict: "queued",
    failure_code: null,
    compile_output: null,
    tests: [],
    passed_count: 0,
    total_count: 3,
    time_ms: null,
    memory_kb: null,
    created_at: NOW,
    ...overrides,
})

const passing = (overrides: Partial<Judge0CaseResult> = {}): Judge0CaseResult => ({
    status: "accepted",
    stdout: "3",
    stderr: "",
    compileOutput: "",
    timeMs: 20,
    memoryKb: 3000,
    ...overrides,
})

interface Setup {
    readonly problem?: JudgingRow | undefined
    readonly rate?: RateRow | undefined
    readonly claimed?: boolean
    readonly emptyRate?: boolean
    readonly emptyInsert?: boolean
    readonly premium?: boolean
    readonly options?: PracticeOptions
    readonly judge?: (gateway: jest.Mocked<Judge0Gateway>) => void
    readonly read?: ReadonlyArray<SubmissionRow>
}

const build = async (setup: Setup = {}) => {
    const problem = "problem" in setup ? setup.problem : problemRow()
    const em = mockEntityManager({
        query: [
            [SELECT_JUDGING, problem === undefined ? [] : [problem]],
            [LOCK_LEARNER, []],
            [FAIL_STALE, []],
            [SELECT_RATE, setup.emptyRate === true ? [] : [setup.rate ?? { recent: 0, in_flight: 0 }]],
            [INSERT_SUBMISSION, setup.emptyInsert === true ? [] : [storedRow()]],
            [CLAIM_SUBMISSION, setup.claimed === false ? [] : [{ submission_id: SUBMISSION }]],
            [COMPLETE_SUBMISSION, []],
            [SELECT_SUBMISSION, setup.read ?? [storedRow({ verdict: "accepted" })]],
        ],
    })
    const tx = fakeTransaction(em)
    const entitlement = mock<EntitlementService>()
    entitlement.isPremium.mockResolvedValue(setup.premium ?? false)
    const judge = mock<Judge0Gateway>()
    judge.run.mockResolvedValue([passing(), passing(), passing()])
    setup.judge?.(judge)
    const streak = mock<PracticeStreakPort>()
    streak.recordStreakAction.mockResolvedValue(undefined)
    const timer = mock<Timer>()
    const cancel = jest.fn()
    timer.schedule.mockReturnValue(cancel)
    const logger = mock<Logger>()
    const options: PracticeOptions = { ...setup.options }
    const moduleRef = await Test.createTestingModule({
        providers: [
            PracticeSubmissionService,
            PracticeJudgeLanesService,
            { provide: PRIMARY_ENTITY_MANAGER, useValue: tx.em },
            { provide: CLOCK, useValue: new FakeClock(NOW) },
            { provide: TIMER, useValue: timer },
            { provide: LOGGER, useValue: logger },
            { provide: ENTITLEMENT_SERVICE, useValue: entitlement },
            { provide: JUDGE0_GATEWAY, useValue: judge },
            { provide: PRACTICE_STREAK, useValue: streak },
            { provide: PRACTICE_OPTIONS, useValue: options },
        ],
    }).compile()
    return { service: moduleRef.get(PracticeSubmissionService), em, tx, judge, streak, timer, cancel, logger }
}

const params = (overrides: Partial<{ source: string; language: string; slug: string }> = {}) => ({
    learnerId: PRACTICE_LEARNER,
    slug: "sum-two",
    language: "python",
    source: "print(1)",
    ...overrides,
})

const completion = (em: Awaited<ReturnType<typeof build>>["em"]): Array<unknown> =>
    em.query.mock.calls.find((call) => call[0] === COMPLETE_SUBMISSION)?.[1] ?? []

const storedTests = (em: Awaited<ReturnType<typeof build>>["em"]): ReadonlyArray<Record<string, unknown>> => {
    try {
        const parsed: unknown = JSON.parse(String(completion(em)[2]))
        return Array.isArray(parsed) ? parsed.filter(isRecord) : []
    } catch (cause) {
        throw cause
    }
}

describe("PracticeSubmissionService submit", () => {
    it("judges the example and every hidden test, stores the verdict and answers the stored submission", async () => {
        const { service, em, judge, tx } = await build()

        const view = await service.submit(params())

        expect(view).toMatchObject({ id: SUBMISSION, verdict: "accepted", kind: "submit" })
        expect(judge.run).toHaveBeenCalledWith({
            correlationId: SUBMISSION,
            language: "python",
            source: "print(1)",
            cases: [
                { stdin: "1 2", expectedOutput: "3" },
                { stdin: `1 1 ${PRACTICE_HIDDEN_MARK}`, expectedOutput: "2" },
                { stdin: "2 2", expectedOutput: "4" },
            ],
            cpuTimeLimitMs: 2000,
            memoryLimitKb: 262144,
        })
        const done = completion(em)
        expect(done[0]).toBe(SUBMISSION)
        expect(done[1]).toBe("accepted")
        expect(done[3]).toBe(3)
        expect(done[4]).toBe(3)
        expect(done[6]).toBe(20)
        expect(done[7]).toBe(3000)
        expect(tx.commits).toBe(1)
    })

    it("stores the rows of a submit with the total of the example plus the hidden tests", async () => {
        const { service, em } = await build()

        await service.submit(params({ language: "PYTHON" }))

        expect(em.query).toHaveBeenCalledWith(INSERT_SUBMISSION, [
            PRACTICE_LEARNER,
            "sum-two",
            "v1",
            "python",
            "submit",
            "print(1)",
            3,
            NOW,
        ])
    })

    it("keeps no hidden test in the summaries it stores", async () => {
        const { service, em } = await build()

        await service.submit(params())

        const tests = String(completion(em)[2])
        expect(tests).not.toContain(PRACTICE_HIDDEN_MARK)
        expect(storedTests(em)).toHaveLength(3)
        expect(storedTests(em).every((test) => test["example"] === null)).toBe(true)
    })
})

describe("PracticeSubmissionService submit and the streak", () => {
    it("announces a graded submit to the streak once, under the submission id", async () => {
        const { service, streak } = await build()

        await service.submit(params())

        expect(streak.recordStreakAction).toHaveBeenCalledTimes(1)
        expect(streak.recordStreakAction).toHaveBeenCalledWith({
            learnerId: PRACTICE_LEARNER,
            shard: "practice",
            action: "graded-attempt",
            actionId: SUBMISSION,
            sourceRef: "practice/sum-two",
            at: NOW,
        })
    })

    it("announces a wrong answer too, since the judge graded it", async () => {
        const { service, streak, em } = await build({
            judge: (judge) => judge.run.mockResolvedValue([passing(), passing({ status: "wrong-answer" }), passing()]),
        })

        await service.submit(params())

        expect(completion(em)[1]).toBe("wrong-answer")
        expect(completion(em)[3]).toBe(2)
        expect(streak.recordStreakAction).toHaveBeenCalledTimes(1)
    })

    it("keeps the grading when the streak refuses and logs the refusal", async () => {
        const { service, streak, logger, em } = await build()
        streak.recordStreakAction.mockRejectedValue(new Error("streak down"))

        await expect(service.submit(params())).resolves.toMatchObject({ verdict: "accepted" })

        expect(logger.error).toHaveBeenCalledWith(PracticeLogEvent.StreakFailed, expect.any(Error), {
            submissionId: SUBMISSION,
        })
        expect(completion(em)[1]).toBe("accepted")
    })

    it("does not announce an internal error of the judge, and stores the stable code", async () => {
        const { service, streak, em, logger } = await build({
            judge: (judge) => judge.run.mockRejectedValue(new Judge0Error({ code: Judge0ErrorCode.Unavailable })),
        })

        await service.submit(params())

        const done = completion(em)
        expect(done[1]).toBe("internal-error")
        expect(done[8]).toBe(Judge0ErrorCode.Unavailable)
        expect(streak.recordStreakAction).not.toHaveBeenCalled()
        expect(logger.error).toHaveBeenCalledWith(PracticeLogEvent.JudgingFailed, expect.any(Judge0Error), {
            submissionId: SUBMISSION,
            code: Judge0ErrorCode.Unavailable,
        })
    })

    it("stores a generic failure code when the judge failed for a reason it did not name", async () => {
        const { service, em } = await build({ judge: (judge) => judge.run.mockRejectedValue(new Error("boom")) })

        await service.submit(params())

        expect(completion(em)[8]).toBe("PRACTICE_JUDGING_FAILED")
    })
})

describe("PracticeSubmissionService submit and the wait", () => {
    it("does not judge a submission another worker already claimed", async () => {
        const { service, judge, streak } = await build({ claimed: false })

        await service.submit(params())

        expect(judge.run).not.toHaveBeenCalled()
        expect(streak.recordStreakAction).not.toHaveBeenCalled()
    })

    it("answers the submission still running when the wait deadline passes first", async () => {
        const { service, timer, cancel } = await build({
            judge: (judge) => judge.run.mockReturnValue(new Promise(() => undefined)),
            read: [storedRow({ verdict: "running" })],
        })
        timer.schedule.mockImplementation((work) => {
            void work()
            return cancel
        })

        await expect(service.submit(params())).resolves.toMatchObject({ verdict: "running" })

        expect(cancel).toHaveBeenCalled()
    })

    it("waits for the verdict no longer than the app's wait time", async () => {
        const { service, timer } = await build({ options: { waitMs: 1234 } })

        await service.submit(params())

        expect(timer.schedule).toHaveBeenCalledWith(expect.any(Function), 1234)
    })
})

describe("PracticeSubmissionService run", () => {
    it("judges the public example only, shows what the program printed and never announces the streak", async () => {
        const { service, judge, streak, em } = await build({
            judge: (gateway) => gateway.run.mockResolvedValue([passing({ stdout: "3\n" })]),
            read: [storedRow({ kind: "run", verdict: "accepted", total_count: 1 })],
        })

        const view = await service.run(params())

        expect(view.kind).toBe("run")
        expect(judge.run).toHaveBeenCalledWith(
            expect.objectContaining({ cases: [{ stdin: "1 2", expectedOutput: "3" }] }),
        )
        expect(em.query).toHaveBeenCalledWith(INSERT_SUBMISSION, expect.arrayContaining(["run", 1]))
        expect(storedTests(em)[0]?.["example"]).toEqual({ input: "1 2", expected: "3", actual: "3\n" })
        expect(streak.recordStreakAction).not.toHaveBeenCalled()
    })
})

describe("PracticeSubmissionService refusals", () => {
    it("refuses a language the problems have no starter code for", async () => {
        const { service, em } = await build()

        await expect(service.submit(params({ language: "cobol" }))).rejects.toMatchObject({
            code: PracticeErrorCode.LanguageUnsupported,
        })

        expect(em.query).not.toHaveBeenCalled()
    })

    it("refuses an empty source", async () => {
        const { service } = await build()

        await expect(service.run(params({ source: "  \n" }))).rejects.toMatchObject({
            code: PracticeErrorCode.SourceEmpty,
        })
    })

    it("refuses a source larger than the app allows, counted in bytes", async () => {
        const { service } = await build({ options: { maxSourceBytes: 4 } })

        await expect(service.run(params({ source: "\u00e9\u00e9\u00e9" }))).rejects.toMatchObject({
            code: PracticeErrorCode.SourceTooLarge,
        })
        await expect(service.run(params({ source: "\u00e9\u00e9" }))).resolves.toBeDefined()
    })

    it("refuses an unknown problem", async () => {
        const { service } = await build({ problem: undefined })

        await expect(service.submit(params())).rejects.toMatchObject({ code: PracticeErrorCode.ProblemNotFound })
    })

    it("refuses a problem beyond the free ones to a learner without Premium, before storing anything", async () => {
        const { service, em, judge } = await build({ problem: problemRow({ rank: 1 }) })

        await expect(service.submit(params())).rejects.toMatchObject({ code: PracticeErrorCode.ProblemLocked })

        expect(em.query).not.toHaveBeenCalledWith(INSERT_SUBMISSION, expect.anything())
        expect(judge.run).not.toHaveBeenCalled()
    })

    it("lets Premium submit a problem beyond the free ones", async () => {
        const { service } = await build({ problem: problemRow({ rank: 7 }), premium: true })

        await expect(service.submit(params())).resolves.toBeDefined()
    })

    it("honours a larger free count of the app", async () => {
        const { service } = await build({ problem: problemRow({ rank: 1 }), options: { freePerPattern: 2 } })

        await expect(service.submit(params())).resolves.toBeDefined()
    })
})

describe("PracticeSubmissionService rate limit", () => {
    it("refuses a learner who already has a submission in flight and stores nothing", async () => {
        const { service, em, tx, judge } = await build({ rate: { recent: 1, in_flight: 1 } })

        await expect(service.submit(params())).rejects.toMatchObject({ code: PracticeErrorCode.RateLimited })

        expect(em.query).not.toHaveBeenCalledWith(INSERT_SUBMISSION, expect.anything())
        expect(tx.rollbacks).toBe(1)
        expect(judge.run).not.toHaveBeenCalled()
    })

    it("refuses a learner who sent the allowed number in the last minute", async () => {
        const { service } = await build({ rate: { recent: 10, in_flight: 0 } })

        await expect(service.submit(params())).rejects.toMatchObject({ code: PracticeErrorCode.RateLimited })
    })

    it("lets a learner send up to one less than the allowed number", async () => {
        const { service } = await build({ rate: { recent: 9, in_flight: 0 } })

        await expect(service.submit(params())).resolves.toBeDefined()
    })

    it("holds the limit the app names", async () => {
        const { service } = await build({ rate: { recent: 2, in_flight: 0 }, options: { submissionsPerMinute: 2 } })

        await expect(service.submit(params())).rejects.toMatchObject({ code: PracticeErrorCode.RateLimited })
    })

    it("counts no submission when the rate query comes back empty", async () => {
        const { service } = await build({ emptyRate: true })

        await expect(service.submit(params())).resolves.toBeDefined()
    })

    it("refuses and rolls back when the stored submission cannot be read back", async () => {
        const { service, tx } = await build({ emptyInsert: true })

        await expect(service.submit(params())).rejects.toMatchObject({ code: PracticeErrorCode.NotSaved })

        expect(tx.rollbacks).toBe(1)
    })

    it("counts under the per-learner lock, the minute window and the stale cut-off", async () => {
        const { service, em } = await build()

        await service.submit(params())

        expect(em.query).toHaveBeenCalledWith(LOCK_LEARNER, [PRACTICE_LEARNER])
        expect(em.query).toHaveBeenCalledWith(SELECT_RATE, [
            PRACTICE_LEARNER,
            MINUTE_AGO,
            new Date("2026-11-08T09:57:00.000Z"),
        ])
    })
})

describe("PracticeSubmissionService read", () => {
    it("gives up a submission that stayed in flight too long, then answers the learner's own submission", async () => {
        const { service, em } = await build({ read: [storedRow({ verdict: "internal-error", failure_code: "X" })] })

        await expect(service.read(PRACTICE_LEARNER, SUBMISSION)).resolves.toMatchObject({
            id: SUBMISSION,
            verdict: "internal-error",
            failureCode: "X",
        })

        expect(em.query).toHaveBeenCalledWith(FAIL_STALE, [PRACTICE_LEARNER, STALE, NOW])
        expect(em.query).toHaveBeenCalledWith(SELECT_SUBMISSION, [PRACTICE_LEARNER, SUBMISSION])
    })

    it("refuses a submission the learner does not own", async () => {
        const { service } = await build({ read: [] })

        await expect(service.read(PRACTICE_LEARNER, "other")).rejects.toMatchObject({
            code: PracticeErrorCode.SubmissionNotFound,
        })
    })
})
