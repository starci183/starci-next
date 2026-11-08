import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { LessonContentService } from "@modules/domain/lesson"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import type { GradedActivityRow } from "./persistence/review.rows"
import { INSERT_RETRIEVAL_STATE, SELECT_GRADED_ACTIVITIES } from "./persistence/review.sql"
import { addDays, dayOf } from "@modules/domain/streak"

/** The most activities of one lesson read. */
const ACTIVITIES_MAX = 500

@Injectable()
/**
 * The producer side of Essentials: when a lesson completes, its retrieval items fall due 1, 7 and 21 days later (the days the
 * teacher authored). Nothing else of review is scheduled by a lesson.
 */
export class ReviewScheduleService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        private readonly content: LessonContentService,
    ) {}

    /**
     * Gives a learner the retrieval items of a lesson version, each due `afterDays` after the completion day. A lesson that is
     * scheduled again changes nothing. Answers how many items were created.
     */
    async enqueueLesson(learnerId: string, lessonId: string, version: string, completedAt: Date): Promise<number> {
        const plan = await this.content.plan(lessonId, version)
        const now = this.clock.now()
        const completedOn = dayOf(completedAt)
        const created = await Promise.all(
            plan.retrieval.map(async (item): Promise<number> => {
                const rows: Array<GradedActivityRow> = await this.entityManager.query(INSERT_RETRIEVAL_STATE, [
                    learnerId,
                    `retrieval:${lessonId}/${item.activityId}`,
                    lessonId,
                    item.activityId,
                    version,
                    item.afterDays,
                    addDays(completedOn, item.afterDays),
                    now,
                ])
                return rows.length
            }),
        )
        return created.reduce((total, count) => total + count, 0)
    }

    /**
     * Called by the attempt capability after it graded an attempt: when every required activity of the lesson version has a
     * graded attempt, the lesson is complete and its retrieval items are scheduled from now. Answers whether the lesson is
     * complete.
     */
    async onActivityGraded(learnerId: string, lessonId: string, version: string): Promise<boolean> {
        const plan = await this.content.plan(lessonId, version)
        if (plan.retrieval.length === 0) return false
        const graded: Array<GradedActivityRow> = await this.entityManager.query(SELECT_GRADED_ACTIVITIES, [
            learnerId,
            lessonId,
            version,
            ACTIVITIES_MAX,
        ])
        const done = new Set(graded.map((row) => row.activity_id))
        if (!plan.required.every((activityId) => done.has(activityId))) return false
        await this.enqueueLesson(learnerId, lessonId, version, this.clock.now())
        return true
    }
}
