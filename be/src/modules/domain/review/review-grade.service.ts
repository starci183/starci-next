import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { StreakService, addDays, dayOf } from "@modules/domain/streak"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, type sql } from "@modules/platform/database"
import { InjectLogger, type Logger } from "@modules/platform/logging"
import { ReviewError, ReviewErrorCode } from "./errors/review.error"
import type { CardRow, CountRow, GoalRow, ReviewRow, StateRow } from "./persistence/review.rows"
import {
    COUNT_REMAINING_DUE,
    COUNT_REVIEWS_ON,
    INSERT_REVIEW,
    SELECT_CARD,
    SELECT_GOAL,
    SELECT_REVIEW,
    SELECT_STATE,
    SELECT_STATE_LOCKED,
    UPDATE_STATE,
} from "./persistence/review.sql"
import { InjectReviewScheduler } from "./review-scheduler.port"
import type { ReviewScheduler, ScheduleResult } from "./review-scheduler.policy"
import { ReviewLogEvent } from "./review.log-events"
import { REVIEW_GOAL_DEFAULT, REVIEW_GRADES, type ReviewGrade, type ReviewGradeView } from "./review.contracts"

/** What a grade is given. */
export interface GradeReviewParams {
    /** The learner. */
    readonly learnerId: string
    /** The item. */
    readonly itemId: string
    /** The revision: the one after the newest stored review of the item. */
    readonly revision: number
    /** The self-grade. */
    readonly grade: string
    /** Whether the learner picked the hidden term in the cloze check, when they checked. */
    readonly clozeCorrect?: boolean | null | undefined
}

@Injectable()
/**
 * The only writer of the schedule: it stores every self-grade once per item and revision, moves the item on the scheduler's
 * ladder in the same transaction, and reports the day to the streak when the last item due today is done.
 */
export class ReviewGradeService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
        @InjectReviewScheduler() private readonly scheduler: ReviewScheduler,
        @InjectLogger() private readonly logger: Logger,
        private readonly streak: StreakService,
    ) {}

    /**
     * Stores the self-grade of a revealed item and schedules the next review. A resend of the same revision with the same grade
     * changes nothing; another grade under it is a conflict; a grade before the flip or the written answer is refused.
     */
    async grade(params: GradeReviewParams): Promise<ReviewGradeView> {
        const grade = REVIEW_GRADES.find((known) => known === params.grade.toLowerCase())
        if (grade === undefined) throw new ReviewError({ code: ReviewErrorCode.GradeInvalid })
        await this.requireAccess(params.learnerId, params.itemId)
        const now = this.clock.now()
        const today = dayOf(now)
        await this.entityManager.transaction(async (manager) => {
            const states: Array<StateRow> = await manager.query(SELECT_STATE_LOCKED, [params.learnerId, params.itemId])
            const state = states[0]
            if (state === undefined) throw new ReviewError({ code: ReviewErrorCode.ItemNotFound })
            const stored: Array<ReviewRow> = await manager.query(SELECT_REVIEW, [
                params.learnerId,
                params.itemId,
                params.revision,
            ])
            if (stored[0] !== undefined) {
                if (stored[0].grade !== grade) throw new ReviewError({ code: ReviewErrorCode.RevisionConflict })
                return
            }
            if (params.revision !== state.last_revision + 1)
                throw new ReviewError({ code: ReviewErrorCode.RevisionConflict })
            if (state.flipped_revision !== params.revision) throw new ReviewError({ code: ReviewErrorCode.NotFlipped })
            await manager.query(INSERT_REVIEW, [
                params.learnerId,
                params.itemId,
                params.revision,
                grade,
                params.clozeCorrect ?? null,
                now,
                today,
            ])
            const next = this.next(state, grade)
            await manager.query(UPDATE_STATE, [
                params.learnerId,
                params.itemId,
                next.status,
                next.step,
                addDays(today, next.intervalDays),
                params.revision,
                now,
            ])
        })
        const view = await this.view(params.learnerId, params.itemId, today)
        if (view.remainingToday === 0) await this.reportDay(params.learnerId, today)
        return view
    }

    private next(state: StateRow, grade: ReviewGrade): ScheduleResult {
        if (state.source === "retrieval") {
            const planned = this.scheduler.scheduleRetrieval(grade)
            return { status: planned.status, step: state.step, intervalDays: planned.intervalDays }
        }
        return this.scheduler.schedule({ step: state.step }, grade)
    }

    private rows<Row>(query: ReturnType<typeof sql>, params: ReadonlyArray<unknown>): Promise<Array<Row>> {
        return this.entityManager.query(query, [...params])
    }

    private async requireAccess(learnerId: string, itemId: string): Promise<void> {
        const states: Array<StateRow> = await this.entityManager.query(SELECT_STATE, [learnerId, itemId])
        const state = states[0]
        if (state === undefined) throw new ReviewError({ code: ReviewErrorCode.ItemNotFound })
        const cards: Array<CardRow> =
            state.source === "flashcard" ? await this.entityManager.query(SELECT_CARD, [itemId]) : []
        if (state.source === "flashcard" && cards[0] === undefined)
            throw new ReviewError({ code: ReviewErrorCode.ItemNotFound })
        if ((cards[0] === undefined || cards[0].is_premium) && !(await this.entitlement.isPremium(learnerId)))
            throw new ReviewError({ code: ReviewErrorCode.PremiumRequired })
    }

    private async view(learnerId: string, itemId: string, today: string): Promise<ReviewGradeView> {
        const premium = await this.entitlement.isPremium(learnerId)
        const [states, goals, done, remaining] = await Promise.all([
            this.rows<StateRow>(SELECT_STATE, [learnerId, itemId]),
            this.rows<GoalRow>(SELECT_GOAL, [learnerId]),
            this.rows<CountRow>(COUNT_REVIEWS_ON, [learnerId, today]),
            this.rows<CountRow>(COUNT_REMAINING_DUE, [learnerId, today, premium]),
        ])
        const state = states[0]
        if (state === undefined) throw new ReviewError({ code: ReviewErrorCode.ItemNotFound })
        return {
            itemId,
            status: state.status,
            step: state.step,
            dueOn: state.due_on,
            goal: { daily: goals[0]?.daily_goal ?? REVIEW_GOAL_DEFAULT, done: done[0]?.total ?? 0 },
            remainingToday: remaining[0]?.total ?? 0,
        }
    }

    /** Tells the streak that the learner finished everything due today; the day is its own action id, so a repeat counts once. */
    private async reportDay(learnerId: string, day: string): Promise<void> {
        try {
            await this.streak.recordStreakAction(learnerId, "review", "review-due-done", {
                actionId: `review-due-done:${day}`,
                sourceRef: `review:${day}`,
            })
        } catch (cause) {
            this.logger.error(ReviewLogEvent.StreakReportFailed, cause, { day })
        }
    }
}
