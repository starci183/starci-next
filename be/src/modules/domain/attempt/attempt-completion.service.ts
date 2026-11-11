import { Injectable, Optional } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { LessonContentService } from "@modules/domain/lesson"
import { ReviewScheduleService } from "@modules/domain/review"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import type { AttemptRow, CompletionRow } from "./persistence/attempt.rows"
import { SELECT_GRADED_ACTIVITY_IDS, UPSERT_COMPLETION } from "./persistence/attempt.sql"

@Injectable()
/** Finishes a lesson: once every required activity is graded it records the completion and opens the 1, 7 and 21 day reviews. */
export class AttemptCompletionService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
        private readonly content: LessonContentService,
        @Optional() private readonly review?: ReviewScheduleService,
    ) {}

    /**
     * When every required activity of the lesson version has a graded attempt (the reflect phase being the last), records the
     * completion once, the first instant staying, and opens the retrieval reviews from that instant. Opening them again is a
     * no-op, so a regrade of any activity repairs a review that failed to open. A lesson that requires nothing never completes.
     * Answers whether the lesson is complete.
     */
    async complete(row: AttemptRow): Promise<boolean> {
        const plan = await this.content.plan(row.lesson_id, row.lesson_version)
        const graded: Array<{ activity_id: string }> = await this.entityManager.query(SELECT_GRADED_ACTIVITY_IDS, [
            row.learner_id,
            row.lesson_id,
            row.lesson_version,
            LIST_ROWS_MAX,
        ])
        const done = new Set(graded.map((entry) => entry.activity_id))
        if (plan.required.length === 0 || !plan.required.every((activityId) => done.has(activityId))) return false
        const rows: Array<CompletionRow> = await this.entityManager.query(UPSERT_COMPLETION, [
            row.learner_id,
            row.lesson_id,
            row.lesson_version,
            this.clock.now(),
        ])
        const completion = rows[0]
        if (completion === undefined) return false
        await this.review?.enqueueLesson(
            row.learner_id,
            row.lesson_id,
            completion.lesson_version,
            completion.completed_at,
        )
        return true
    }
}
