import { Injectable, Optional } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { LessonContentService, LessonReadService, type LessonOutline } from "@modules/domain/lesson"
import { ReviewScheduleService } from "@modules/domain/review"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import type {
    AttemptLookupParams,
    AttemptView,
    LessonProgressView,
    OutcomeStateView,
    ProgressLookupParams,
} from "./attempt.contracts"
import { newestVersionOf, toAttemptView, toProgressView } from "./attempt.mapper"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"
import { outcomeStateOf, type LatestByActivity } from "./outcome-state.policy"
import { phasesOf } from "./phase-state.policy"
import type {
    ActivityProgressRow,
    AttemptRow,
    CompletionRow,
    OutcomeRow,
    SimulationProgressRow,
} from "./persistence/attempt.rows"
import {
    SELECT_ACTIVITY_PROGRESS,
    SELECT_ATTEMPT,
    SELECT_COMPLETION,
    SELECT_OUTCOMES,
    SELECT_SIMULATION_PROGRESS,
} from "./persistence/attempt.sql"
import { withExpectedNotes } from "./rubric-grading.policy"

/** A grade stored before graders wrote notes takes the expected evidence of its criteria, so the learner always reads one line. */
const notedRow = (row: ActivityProgressRow, outline: LessonOutline): ActivityProgressRow => {
    const evidence = outline.activities.find((activity) => activity.id === row.activity_id)?.expectedEvidence
    return row.result === null || evidence === undefined
        ? row
        : { ...row, result: withExpectedNotes(row.result, evidence) }
}

const outcomesOf = (
    outline: LessonOutline,
    rows: ReadonlyArray<OutcomeRow>,
    latest: LatestByActivity,
    isCompleted: boolean,
): Array<OutcomeStateView> => {
    const levelsOf = new Map(rows.map((row) => [row.outcome_id, row]))
    const extra = rows.filter((row) => !outline.outcomeIds.includes(row.outcome_id)).map((row) => row.outcome_id)
    return [...outline.outcomeIds, ...extra].map((id) => ({
        id,
        understood: levelsOf.get(id)?.understood ?? 0,
        proved: levelsOf.get(id)?.proved ?? 0,
        state: outcomeStateOf(id, outline, latest, isCompleted),
    }))
}

@Injectable()
/** Serves a learner their own attempts and their progress in a lesson; another learner's attempt is not found. */
export class AttemptReadService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        private readonly lessons: LessonReadService,
        private readonly content: LessonContentService,
        @Optional() private readonly review?: ReviewScheduleService,
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

    /**
     * Everything the step pages need after a reload: the newest attempt of each activity whole (the answer, the grade and the
     * notes on what is missing), each phase open or done, each outcome not started, learning, mastered or needing review, the
     * simulation positions, when the lesson was finished and the reviews that opened. A lesson that is not live is not found.
     */
    async progress(params: ProgressLookupParams): Promise<LessonProgressView> {
        const locale = params.locale ?? "vi"
        const live = await this.lessons.find({ id: params.lessonId, locale, learnerId: params.learnerId })
        const bound = [params.learnerId, params.lessonId, LIST_ROWS_MAX]
        const outcomes: Promise<Array<OutcomeRow>> = this.entityManager.query(SELECT_OUTCOMES, bound)
        const attempts: Promise<Array<ActivityProgressRow>> = this.entityManager.query(SELECT_ACTIVITY_PROGRESS, bound)
        const completion: Promise<Array<CompletionRow>> = this.entityManager.query(SELECT_COMPLETION, [
            params.learnerId,
            params.lessonId,
        ])
        const simulation: Promise<Array<SimulationProgressRow>> = this.entityManager.query(
            SELECT_SIMULATION_PROGRESS,
            bound,
        )
        const [outcomeRows, activityRows, completions, simulations] = await Promise.all([
            outcomes,
            attempts,
            completion,
            simulation,
        ])
        const outline = await this.content.outline(
            params.lessonId,
            newestVersionOf(activityRows) ?? live.version,
            locale,
        )
        const completedAt = completions[0]?.completed_at ?? null
        const activities = activityRows.map((row) => notedRow(row, outline))
        const latest: LatestByActivity = new Map(activities.map((row) => [row.activity_id, toAttemptView(row)]))
        const reviews =
            completedAt === null ? [] : ((await this.review?.lessonSchedule(params.learnerId, params.lessonId)) ?? [])
        return toProgressView({
            lessonId: params.lessonId,
            outcomes: outcomesOf(outline, outcomeRows, latest, completedAt !== null),
            phases: phasesOf(outline, latest, completedAt !== null),
            activities,
            completedAt,
            simulations,
            reviews,
        })
    }
}
