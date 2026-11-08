import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import {
    InjectJudge0Gateway,
    Judge0Error,
    type Judge0CaseResult,
    type Judge0Gateway,
} from "@modules/integrations/judge0"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { InjectTimer, type Timer } from "@modules/platform/retry"
import { PracticeError, PracticeErrorCode } from "./errors/practice.error"
import { isBeyondFree } from "./practice-access.policy"
import { PracticeJudgeLanesService } from "./practice-judge-lanes.service"
import { settingsOf } from "./practice-settings.policy"
import { InjectPracticeStreak, type PracticeStreakPort } from "./practice-streak.port"
import { compileOutputOf, isGraded, peakOf, summariesOf, verdictOf } from "./practice-verdict.policy"
import { toSubmissionView } from "./practice-view.mapper"
import { InjectPracticeOptions } from "./practice.decorators"
import { PracticeLogEvent } from "./practice.log-events"
import type { PracticeOptions } from "./practice.options"
import {
    PRACTICE_LANGUAGES,
    type PracticeLanguage,
    type PracticeSolveParams,
    type PracticeSubmissionKind,
    type PracticeSubmissionView,
    type PracticeTestSummary,
    type PracticeVerdict,
} from "./practice.contracts"
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

/** The window the per-learner submission limit counts in. */
const RATE_WINDOW_MS = 60_000

/** How long a submission may stay queued or running before it is given up as an internal error. */
const STALE_MS = 180_000

/** The failure code of a submission the judge could not finish for a reason the judge did not name. */
const JUDGING_FAILED = "PRACTICE_JUDGING_FAILED"

const languageOf = (value: string): PracticeLanguage => {
    const found = PRACTICE_LANGUAGES.find((language) => language === value.toLowerCase())
    if (found === undefined) throw new PracticeError({ code: PracticeErrorCode.LanguageUnsupported })
    return found
}

/** What one judging job needs once the submission is stored. */
/** What the judge answered for one submission, as it is stored. */
interface Outcome {
    readonly verdict: PracticeVerdict
    readonly tests: ReadonlyArray<PracticeTestSummary>
    readonly passed: number
    readonly total: number
    readonly compileOutput: string | null
    readonly failureCode: string | null
    readonly timeMs: number | null
    readonly memoryKb: number | null
}

interface Job {
    readonly submissionId: string
    readonly learnerId: string
    readonly kind: PracticeSubmissionKind
    readonly language: PracticeLanguage
    readonly problem: JudgingRow
}

@Injectable()
/**
 * Runs and submits solutions: it checks the language, the size, Premium and the rate limit, stores the submission queued, hands
 * it to the bounded queue in front of Judge0 and waits a short while for the verdict. A run judges the public example only and
 * counts for nothing; a submit judges the example and every hidden test, and a graded submit is announced to the streak.
 */
export class PracticeSubmissionService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectTimer() private readonly timer: Timer,
        @InjectLogger() private readonly logger: Logger,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectJudge0Gateway() private readonly judge: Judge0Gateway,
        @InjectPracticeStreak() private readonly streak: PracticeStreakPort,
        @InjectPracticeOptions() private readonly options: PracticeOptions,
        private readonly queue: PracticeJudgeLanesService,
    ) {}

    /** Runs the solution against the public example of the problem; nothing about the run counts as an attempt. */
    run(params: PracticeSolveParams): Promise<PracticeSubmissionView> {
        return this.solve("run", params)
    }

    /** Submits the solution against the example and every hidden test of the problem. */
    submit(params: PracticeSolveParams): Promise<PracticeSubmissionView> {
        return this.solve("submit", params)
    }

    /** Reads a submission of a learner as it stands; one that stayed in flight too long is given up first. */
    async read(learnerId: string, submissionId: string): Promise<PracticeSubmissionView> {
        const now = this.clock.now()
        await this.entityManager.query(FAIL_STALE, [learnerId, new Date(now.getTime() - STALE_MS), now])
        const rows: Array<SubmissionRow> = await this.entityManager.query(SELECT_SUBMISSION, [learnerId, submissionId])
        const row = rows[0]
        if (row === undefined) throw new PracticeError({ code: PracticeErrorCode.SubmissionNotFound })
        return toSubmissionView(row)
    }

    private async solve(kind: PracticeSubmissionKind, params: PracticeSolveParams): Promise<PracticeSubmissionView> {
        const settings = settingsOf(this.options)
        const language = languageOf(params.language)
        if (params.source.trim() === "") throw new PracticeError({ code: PracticeErrorCode.SourceEmpty })
        if (Buffer.byteLength(params.source, "utf8") > settings.maxSourceBytes)
            throw new PracticeError({ code: PracticeErrorCode.SourceTooLarge })
        const found: Array<JudgingRow> = await this.entityManager.query(SELECT_JUDGING, [params.slug])
        const problem = found[0]
        if (problem === undefined) throw new PracticeError({ code: PracticeErrorCode.ProblemNotFound })
        if (
            isBeyondFree(problem.rank, settings.freePerPattern) &&
            !(await this.entitlement.isPremium(params.learnerId))
        )
            throw new PracticeError({ code: PracticeErrorCode.ProblemLocked })
        const stored = await this.store(kind, language, params, problem)
        const job = this.queue.run(() =>
            this.judging(
                { submissionId: stored.submission_id, learnerId: params.learnerId, kind, language, problem },
                params,
            ),
        )
        await this.waitFor(job, settings.waitMs)
        return this.read(params.learnerId, stored.submission_id)
    }

    /**
     * Stores the submission queued under the per-learner lock, so two requests of one learner cannot both pass the check: a
     * learner has at most one submission in flight and at most `submissionsPerMinute` per minute.
     */
    private store(
        kind: PracticeSubmissionKind,
        language: PracticeLanguage,
        params: PracticeSolveParams,
        problem: JudgingRow,
    ): Promise<SubmissionRow> {
        const settings = settingsOf(this.options)
        const now = this.clock.now()
        const total = problem.examples.length + (kind === "submit" ? problem.tests.length : 0)
        return this.entityManager.transaction(async (manager) => {
            await manager.query(LOCK_LEARNER, [params.learnerId])
            await manager.query(FAIL_STALE, [params.learnerId, new Date(now.getTime() - STALE_MS), now])
            const rates: Array<RateRow> = await manager.query(SELECT_RATE, [
                params.learnerId,
                new Date(now.getTime() - RATE_WINDOW_MS),
                new Date(now.getTime() - STALE_MS),
            ])
            const rate = rates[0]
            if ((rate?.in_flight ?? 0) > 0 || (rate?.recent ?? 0) >= settings.submissionsPerMinute)
                throw new PracticeError({ code: PracticeErrorCode.RateLimited })
            const inserted: Array<SubmissionRow> = await manager.query(INSERT_SUBMISSION, [
                params.learnerId,
                problem.problem_id,
                problem.version,
                language,
                kind,
                params.source,
                total,
                now,
            ])
            const row = inserted[0]
            if (row === undefined) throw new PracticeError({ code: PracticeErrorCode.NotSaved })
            return row
        })
    }

    /** Waits for the job or for the wait deadline, whichever comes first; the deadline is cancelled either way. */
    private async waitFor(job: Promise<void>, waitMs: number): Promise<void> {
        const cancels: Array<() => void> = []
        const expired = new Promise<void>((resolve) => cancels.push(this.timer.schedule(resolve, waitMs)))
        try {
            await Promise.race([job, expired])
        } finally {
            cancels.forEach((cancel) => cancel())
        }
    }

    /** Judges the stored submission and stores its verdict; never rejects, a failure becomes the internal-error verdict. */
    private async judging(job: Job, params: PracticeSolveParams): Promise<void> {
        const now = this.clock.now()
        const claimed: Array<{ submission_id: string }> = await this.entityManager.query(CLAIM_SUBMISSION, [
            job.submissionId,
            now,
        ])
        if (claimed.length === 0) return
        const examples = job.problem.examples
        const cases = job.kind === "run" ? examples : [...examples, ...job.problem.tests]
        try {
            const results = await this.judge.run({
                correlationId: job.submissionId,
                language: job.language,
                source: params.source,
                cases: cases.map((test) => ({ stdin: test.input, expectedOutput: test.output })),
                cpuTimeLimitMs: job.problem.time_limit_ms,
                memoryLimitKb: job.problem.memory_limit_kb,
            })
            await this.finish(job, results)
        } catch (cause) {
            const code = cause instanceof Judge0Error ? cause.code : JUDGING_FAILED
            this.logger.error(PracticeLogEvent.JudgingFailed, cause, { submissionId: job.submissionId, code })
            await this.complete(job, {
                verdict: "internal-error",
                tests: [],
                passed: 0,
                total: cases.length,
                compileOutput: null,
                failureCode: code,
                timeMs: null,
                memoryKb: null,
            })
        }
    }

    private async finish(job: Job, results: ReadonlyArray<Judge0CaseResult>): Promise<void> {
        const verdict = verdictOf(results)
        const tests = summariesOf(results, job.kind === "run" ? job.problem.examples : [])
        await this.complete(job, {
            verdict,
            tests,
            passed: tests.filter((test) => test.passed).length,
            total: results.length,
            compileOutput: compileOutputOf(results),
            failureCode: null,
            timeMs: peakOf(results.map((result) => result.timeMs)),
            memoryKb: peakOf(results.map((result) => result.memoryKb)),
        })
        if (job.kind === "submit" && isGraded(verdict)) await this.announce(job)
    }

    private async complete(job: Job, outcome: Outcome): Promise<void> {
        await this.entityManager.query(COMPLETE_SUBMISSION, [
            job.submissionId,
            outcome.verdict,
            JSON.stringify(outcome.tests),
            outcome.passed,
            outcome.total,
            outcome.compileOutput,
            outcome.timeMs,
            outcome.memoryKb,
            outcome.failureCode,
            this.clock.now(),
        ])
    }

    /** Announces the graded submit to the streak under the submission id; a refusal is logged and never undoes the grading. */
    private async announce(job: Job): Promise<void> {
        try {
            await this.streak.recordStreakAction({
                learnerId: job.learnerId,
                shard: "practice",
                action: "graded-attempt",
                actionId: job.submissionId,
                sourceRef: `practice/${job.problem.problem_id}`,
                at: this.clock.now(),
            })
        } catch (cause) {
            this.logger.error(PracticeLogEvent.StreakFailed, cause, { submissionId: job.submissionId })
        }
    }
}
