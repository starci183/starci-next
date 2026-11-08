import { Injectable, Optional } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { LessonContentService, type LessonActivity, type LessonPhase } from "@modules/domain/lesson"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { ReviewScheduleService } from "@modules/domain/review"
import { StreakService } from "@modules/domain/streak"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ok, refused, type Outcome } from "@modules/platform/primitives"
import { InjectTimer, type Timer } from "@modules/platform/retry"
import { InjectAttemptCoach, type AttemptCoach } from "./attempt-coach.port"
import { AttemptFairUseService } from "./attempt-fair-use.service"
import { attemptKindOf, attemptPhaseOf, normalizeAnswer } from "./attempt-answer.policy"
import type {
    AttemptAnswer,
    AttemptKind,
    AttemptResult,
    AttemptView,
    CoachGradeRequest,
    SubmitAttemptParams,
} from "./attempt.contracts"
import { AttemptLogEvent } from "./attempt.log-events"
import { toAttemptView } from "./attempt.mapper"
import { gradeChoice } from "./choice-grading.policy"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"
import { NO_OUTCOME_LEVELS, levelsOf } from "./outcome-level.policy"
import type { AttemptRow, ReplayRow } from "./persistence/attempt.rows"
import {
    CLAIM_GRADING,
    COMPLETE_GRADING,
    FAIL_GRADING,
    INSERT_ATTEMPT,
    SELECT_ATTEMPT,
    SELECT_REPLAY,
    UPSERT_OUTCOMES,
} from "./persistence/attempt.sql"
import { coachRubricOf, gradeRubric } from "./rubric-grading.policy"
import { gradeSimulation } from "./simulation-grading.policy"

/** How long the coach has to grade one answer. */
const GRADING_TIMEOUT_MS = 60_000

/** How long a run may hold an attempt in grading without a sign of life before another run may take it over. */
const GRADING_STALE_MS = 2 * GRADING_TIMEOUT_MS

/** The one thing a provider sees of an attempt: the answer as quoted data, the rubric and an opaque id that names no learner. */
const requestOf = (row: AttemptRow, activity: LessonActivity): CoachGradeRequest => ({
    requestId: row.attempt_id,
    locale: row.locale,
    prompt: activity.prompt,
    kind: row.kind === "exercise" ? "exercise" : "explain",
    answerText: row.answer.text ?? "",
    files: row.answer.files ?? [],
    rubric: coachRubricOf(activity),
    timeoutMs: GRADING_TIMEOUT_MS,
})

/** The attempt as a submit stores it: the row the insert answered, or null when the revision was already stored. */
type StoredAttempt = AttemptRow | null

@Injectable()
/**
 * The only writer of the lesson attempts: it stores every answer once per learner, activity and revision, grades choices and
 * simulations on the spot, grades written answers through the coach after the answer is stored, and raises the outcome levels
 * of the graded attempts.
 */
export class AttemptService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectTimer() private readonly timer: Timer,
        @InjectLogger() private readonly logger: Logger,
        @InjectAttemptCoach() private readonly coach: AttemptCoach,
        private readonly content: LessonContentService,
        private readonly fairUse: AttemptFairUseService,
        @Optional() private readonly streak?: StreakService,
        @Optional() private readonly review?: ReviewScheduleService,
    ) {}

    /**
     * Stores the answer of a learner to an activity and grades it. Premium is needed for every phase but the free one, and
     * is checked before the answer is stored and before any coach call. A resend of the same revision with the same answer
     * answers the stored attempt (and retries the grading of a written answer that failed); the same revision with another
     * answer is refused.
     */
    async submit(params: SubmitAttemptParams): Promise<AttemptView> {
        const found = await this.content.activity({
            lessonId: params.lessonId,
            version: params.version,
            activityId: params.activityId,
            locale: params.locale,
        })
        const kind = attemptKindOf(found.activity)
        const phase = attemptPhaseOf(found)
        await this.content.requireAccess({ learnerId: params.learnerId, phase })
        const answer = normalizeAnswer(found.activity, kind, params.answer)
        const stored = await this.store(params, found.activity, kind, answer, phase)
        const row = stored ?? (await this.replay(params, answer))
        if (stored !== null && stored.status === "graded") await this.afterGraded(stored)
        return row.status === "graded" ? toAttemptView(row) : this.grade(row, found.activity)
    }

    /** Grades a choice or a simulation on the spot; a written answer has no grade until the coach gives one. */
    private gradeNow(activity: LessonActivity, kind: AttemptKind, answer: AttemptAnswer): AttemptResult | null {
        if (kind === "choice") return gradeChoice(activity, answer)
        return kind === "simulation" ? gradeSimulation(activity, answer) : null
    }

    /**
     * Inserts the attempt with the outcome rows it trains in one transaction; a graded choice or simulation is inserted
     * graded and raises its outcome levels at once. Nothing is stored for a revision that already exists.
     */
    private store(
        params: SubmitAttemptParams,
        activity: LessonActivity,
        kind: AttemptKind,
        answer: AttemptAnswer,
        phase: LessonPhase,
    ): Promise<StoredAttempt> {
        const result = this.gradeNow(activity, kind, answer)
        const levels = result === null ? NO_OUTCOME_LEVELS : levelsOf(kind, result)
        const now = this.clock.now()
        return this.entityManager.transaction(async (manager) => {
            const inserted: Array<AttemptRow> = await manager.query(INSERT_ATTEMPT, [
                params.learnerId,
                params.lessonId,
                params.version,
                params.activityId,
                params.revision,
                kind,
                phase,
                params.locale,
                activity.isDiagnostic === true,
                JSON.stringify(answer),
                result === null ? "saved" : "graded",
                result === null ? null : JSON.stringify(result),
                now,
                result === null ? null : now,
            ])
            const row = inserted[0]
            if (row === undefined) return null
            await manager.query(UPSERT_OUTCOMES, [
                params.learnerId,
                params.lessonId,
                activity.outcomeIds,
                levels.understood,
                levels.proved,
                now,
            ])
            return row
        })
    }

    /** Finds the attempt a resend repeats; another answer under the same revision is a conflict. */
    private async replay(params: SubmitAttemptParams, answer: AttemptAnswer): Promise<ReplayRow> {
        const rows: Array<ReplayRow> = await this.entityManager.query(SELECT_REPLAY, [
            params.learnerId,
            params.lessonId,
            params.version,
            params.activityId,
            params.revision,
            JSON.stringify(answer),
        ])
        const row = rows[0]
        if (row === undefined) throw new AttemptError({ code: AttemptErrorCode.NotSaved })
        if (!row.same_answer) throw new AttemptError({ code: AttemptErrorCode.RevisionConflict })
        return row
    }

    /** Takes a stored written answer for grading, asks the coach and keeps the grade or the failure code. */
    private async grade(row: AttemptRow, activity: LessonActivity): Promise<AttemptView> {
        const now = this.clock.now()
        const claimed = await this.claim(row.attempt_id, now)
        if (claimed === undefined) return this.current(row)
        const graded = await this.askCoach(claimed, activity)
        return graded.kind === "ok" ? this.complete(claimed, activity, graded.value) : this.fail(claimed, graded.code)
    }

    /** Takes the attempt for grading unless it is graded or another run holds it; answers the attempt as taken. */
    private async claim(attemptId: string, now: Date): Promise<AttemptRow | undefined> {
        const stale = new Date(now.getTime() - GRADING_STALE_MS)
        const rows: Array<AttemptRow> = await this.entityManager.query(CLAIM_GRADING, [attemptId, now, stale])
        return rows[0]
    }

    /**
     * Asks the coach for the grade under a deadline and checks it against the rubric, once the learner is inside the fair-use
     * limit of the day. A limit reached, a failure of the coach, a deadline or a grade the rubric refuses is a refusal with its
     * stable code, never a throw, so the answer stays saved.
     */
    private async askCoach(
        row: AttemptRow,
        activity: LessonActivity,
    ): Promise<Outcome<AttemptResult, AttemptErrorCode>> {
        try {
            if (!(await this.fairUse.isWithinDailyLimit(row.learner_id)))
                throw new AttemptError({ code: AttemptErrorCode.CoachLimitReached })
            const grade = await this.beforeDeadline(this.coach.grade(requestOf(row, activity)))
            return ok(gradeRubric(activity, row.answer, grade))
        } catch (cause) {
            const code = cause instanceof AttemptError ? cause.code : AttemptErrorCode.CoachUnavailable
            this.logger.error(AttemptLogEvent.GradingFailed, cause, {
                attemptId: row.attempt_id,
                activityId: row.activity_id,
                code,
            })
            return refused(code)
        }
    }

    /** Waits for the work, or fails with ATTEMPT_COACH_UNAVAILABLE once the grading deadline passes; the deadline is cancelled either way. */
    private async beforeDeadline<T>(work: Promise<T>): Promise<T> {
        const scheduled: Array<() => void> = []
        const expired = new Promise<never>((_resolve, reject) => {
            scheduled.push(
                this.timer.schedule(
                    () => reject(new AttemptError({ code: AttemptErrorCode.CoachUnavailable })),
                    GRADING_TIMEOUT_MS,
                ),
            )
        })
        try {
            return await Promise.race([work, expired])
        } finally {
            scheduled.forEach((cancel) => cancel())
        }
    }

    /** Stores the grade and raises the outcome levels in one transaction; answers the attempt as it stands when it is no longer being graded. */
    private async complete(row: AttemptRow, activity: LessonActivity, result: AttemptResult): Promise<AttemptView> {
        const now = this.clock.now()
        const levels = levelsOf(row.kind, result)
        const completed = await this.entityManager.transaction(async (manager) => {
            const rows: Array<AttemptRow> = await manager.query(COMPLETE_GRADING, [
                row.attempt_id,
                JSON.stringify(result),
                now,
            ])
            const done = rows[0]
            if (done === undefined) return undefined
            await manager.query(UPSERT_OUTCOMES, [
                row.learner_id,
                row.lesson_id,
                activity.outcomeIds,
                levels.understood,
                levels.proved,
                now,
            ])
            return done
        })
        if (completed !== undefined) await this.afterGraded(completed)
        return completed === undefined ? this.current(row) : toAttemptView(completed)
    }

    /**
     * Tells the streak (one graded attempt of Essentials, counted once per attempt id) and review (a lesson may now be complete,
     * so its retrieval items are scheduled) that a graded attempt was stored. Neither can fail the attempt.
     */
    private async afterGraded(row: AttemptRow): Promise<void> {
        try {
            await this.streak?.recordStreakAction(row.learner_id, "essentials", "graded-attempt", {
                actionId: `attempt:${row.attempt_id}`,
                sourceRef: row.attempt_id,
            })
            await this.review?.onActivityGraded(row.learner_id, row.lesson_id, row.lesson_version)
        } catch (cause) {
            this.logger.error(AttemptLogEvent.AfterGradedFailed, cause, { attemptId: row.attempt_id })
        }
    }

    /** Marks the attempt failed with the stable code; answers the attempt as it stands when it is no longer being graded. */
    private async fail(row: AttemptRow, code: AttemptErrorCode): Promise<AttemptView> {
        const rows: Array<AttemptRow> = await this.entityManager.query(FAIL_GRADING, [
            row.attempt_id,
            code,
            this.clock.now(),
        ])
        const failed = rows[0]
        return failed === undefined ? this.current(row) : toAttemptView(failed)
    }

    /** Reads the attempt again as it stands. */
    private async current(row: AttemptRow): Promise<AttemptView> {
        const rows: Array<AttemptRow> = await this.entityManager.query(SELECT_ATTEMPT, [row.learner_id, row.attempt_id])
        const found = rows[0]
        if (found === undefined) throw new AttemptError({ code: AttemptErrorCode.NotSaved })
        return toAttemptView(found)
    }
}
