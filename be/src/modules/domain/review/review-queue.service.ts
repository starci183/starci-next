import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { LessonReadService } from "@modules/domain/lesson"
import { InjectNotificationProducer, type NotificationProducerPort } from "@modules/domain/notification"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, type sql } from "@modules/platform/database"
import { dayOf } from "@modules/domain/streak"
import {
    REVIEW_GOAL_DEFAULT,
    type ReviewItemSummary,
    type ReviewLocale,
    type ReviewSummary,
    type ReviewTodayView,
} from "./review.contracts"
import type { CountRow, GoalRow, QueueRow } from "./persistence/review.rows"
import { CLAIM_DUE_NOTICE, COUNT_REVIEWS_ON, SELECT_GOAL, SELECT_QUEUE } from "./persistence/review.sql"

/** The most queue rows read for one learner. */
const QUEUE_ROWS_MAX = 2000

/** The part of the queue a learner can review today. */
interface DayQueue {
    readonly date: string
    readonly goal: number
    readonly done: number
    readonly due: ReadonlyArray<QueueRow>
    readonly fresh: ReadonlyArray<QueueRow>
}

@Injectable()
/** Builds the daily queue of a learner: what is due and what is new up to the goal. */
export class ReviewQueueService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        private readonly lessons: LessonReadService,
        @InjectNotificationProducer() private readonly notifications: NotificationProducerPort,
    ) {}

    /** The queue of the day: due items (overdue first, oldest first), new items up to the goal. */
    async today(learnerId: string, locale: ReviewLocale): Promise<ReviewTodayView> {
        const queue = await this.build(learnerId)
        const titles = await this.lessonTitles(locale)
        const summarize = (row: QueueRow): ReviewItemSummary => ({
            itemId: row.item_id,
            source: row.source,
            status: row.status,
            deckTitle: row.deck_titles?.[locale] ?? null,
            lessonTitle: row.lesson_id === null ? null : (titles.get(row.lesson_id) ?? row.lesson_id),
            level: row.level,
            dueOn: row.due_on,
        })
        return {
            date: queue.date,
            due: queue.due.length,
            overdue: queue.due.filter((row) => row.due_on < queue.date).length,
            newAvailable: queue.fresh.length,
            goal: { daily: queue.goal, done: queue.done },
            items: [...queue.due.map((row) => summarize(row)), ...queue.fresh.map((row) => summarize(row))],
        }
    }

    /** The counts of the day, for the hub. */
    async summary(learnerId: string, _locale: ReviewLocale): Promise<ReviewSummary> {
        const queue = await this.build(learnerId)
        return {
            date: queue.date,
            due: queue.due.length,
            overdue: queue.due.filter((row) => row.due_on < queue.date).length,
            newAvailable: queue.fresh.length,
            goalDaily: queue.goal,
            doneToday: queue.done,
        }
    }

    private rows<Row>(query: ReturnType<typeof sql>, params: ReadonlyArray<unknown>): Promise<Array<Row>> {
        return this.entityManager.query(query, [...params])
    }

    private async build(learnerId: string): Promise<DayQueue> {
        const date = dayOf(this.clock.now())
        const [rows, goals, counts] = await Promise.all([
            this.rows<QueueRow>(SELECT_QUEUE, [learnerId, QUEUE_ROWS_MAX]),
            this.rows<GoalRow>(SELECT_GOAL, [learnerId]),
            this.rows<CountRow>(COUNT_REVIEWS_ON, [learnerId, date]),
        ])
        const goal = goals[0]?.daily_goal ?? REVIEW_GOAL_DEFAULT
        const done = counts[0]?.total ?? 0
        const due = rows.filter((row) => row.status !== "new" && row.due_on <= date)
        const fresh = rows.filter((row) => row.status === "new")
        const room = Math.max(0, goal - done - due.length)
        await this.notifyDue(learnerId, date, due.length)
        return {
            date,
            goal,
            done,
            due,
            fresh: fresh.slice(0, room),
        }
    }

    /**
     * NOTIFICATION CALL SITE (review.due): tells the learner "N review cards due" once per day, the first time the day's queue
     * is built with something due. The once-a-day guard is the claim row, so a reread or a retry notifies nothing more.
     */
    private async notifyDue(learnerId: string, date: string, due: number): Promise<void> {
        if (due === 0) return
        const claimed: Array<{ learner_id: string }> = await this.entityManager.query(CLAIM_DUE_NOTICE, [
            learnerId,
            date,
            REVIEW_GOAL_DEFAULT,
            this.clock.now(),
        ])
        if (claimed.length === 0) return
        await this.notifications.notify(learnerId, "review.due", { count: due }, "/review")
    }

    private async lessonTitles(locale: ReviewLocale): Promise<ReadonlyMap<string, string>> {
        const catalog = await this.lessons.catalog({
            locale,
            group: null,
            topic: null,
            category: null,
            difficulty: null,
            language: null,
            provider: null,
            q: null,
        })
        return new Map(catalog.map((lesson) => [lesson.id, lesson.title]))
    }
}
