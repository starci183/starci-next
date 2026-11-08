import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { LessonReadService } from "@modules/domain/lesson"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import type { AttemptLookupParams, AttemptView, LessonProgressView, ProgressLookupParams } from "./attempt.contracts"
import { toAttemptView, toProgressView } from "./attempt.mapper"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"
import type { ActivityProgressRow, AttemptRow, OutcomeRow } from "./persistence/attempt.rows"
import { SELECT_ACTIVITY_PROGRESS, SELECT_ATTEMPT, SELECT_OUTCOMES } from "./persistence/attempt.sql"

@Injectable()
/** Serves a learner their own attempts and their progress in a lesson; another learner's attempt is not found. */
export class AttemptReadService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        private readonly lessons: LessonReadService,
    ) {}

    /** One attempt of the learner with its status and, once graded, its result. */
    async find(params: AttemptLookupParams): Promise<AttemptView> {
        const rows: Array<AttemptRow> = await this.entityManager.query(SELECT_ATTEMPT, [
            params.learnerId,
            params.attemptId,
        ])
        const row = rows[0]
        if (row === undefined) throw new AttemptError({ code: AttemptErrorCode.NotFound })
        return toAttemptView(row)
    }

    /** The furthest phase, the outcome levels and the attempts of the learner in a lesson; empty before the first attempt. A lesson that is not live is not found. */
    async progress(params: ProgressLookupParams): Promise<LessonProgressView> {
        await this.lessons.find({ id: params.lessonId, locale: "vi", learnerId: params.learnerId })
        const outcomes: Promise<Array<OutcomeRow>> = this.entityManager.query(SELECT_OUTCOMES, [
            params.learnerId,
            params.lessonId,
            LIST_ROWS_MAX,
        ])
        const activities: Promise<Array<ActivityProgressRow>> = this.entityManager.query(SELECT_ACTIVITY_PROGRESS, [
            params.learnerId,
            params.lessonId,
            LIST_ROWS_MAX,
        ])
        const [outcomeRows, activityRows] = await Promise.all([outcomes, activities])
        return toProgressView(params.lessonId, outcomeRows, activityRows)
    }
}
