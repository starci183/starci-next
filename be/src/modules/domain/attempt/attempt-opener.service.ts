import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager, LIST_ROWS_MAX } from "@modules/platform/database"
import type { OpenerScoreRow } from "./persistence/attempt.rows"
import { SELECT_OPENER_SCORES } from "./persistence/attempt.sql"

/** The most lessons one read scores: a topic page lists fewer. */
export const OPENER_LESSONS_MAX = 50

/** One opener question of a learner: right the first time, right now, and how often answered. */
export interface OpenerQuestionScoreView {
    /** The activity id, `opener.<question id>`. */
    readonly activityId: string
    /** Whether the first graded answer was right (the "before"). */
    readonly firstCorrect: boolean
    /** Whether the newest graded answer is right (the "after"). */
    readonly latestCorrect: boolean
    /** The graded answers given. */
    readonly attempts: number
}

/** The opener of one lesson for a learner: how many questions were answered, right before and right now. */
export interface OpenerScoreView {
    /** The lesson. */
    readonly lessonId: string
    /** The questions answered at least once. */
    readonly answered: number
    /** The questions right the first time. */
    readonly firstCorrect: number
    /** The questions right now. */
    readonly latestCorrect: number
    /** Each answered question. */
    readonly questions: ReadonlyArray<OpenerQuestionScoreView>
}

/** What an opener read is given. */
export interface OpenerScoresParams {
    /** The learner who asks. */
    readonly learnerId: string
    /** The lessons to score. */
    readonly lessonIds: ReadonlyArray<string>
}

@Injectable()
/**
 * Scores the five-question opener of lessons from the graded choice attempts stored under `opener.<question id>`: the first
 * answer of each question is the "before", the newest the "after". A lesson the learner never opened is answered with zeros.
 */
export class AttemptOpenerService {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /** The opener of each asked lesson, in the asked order. */
    async scores(params: OpenerScoresParams): Promise<ReadonlyArray<OpenerScoreView>> {
        const lessonIds = [...new Set(params.lessonIds)].slice(0, OPENER_LESSONS_MAX)
        const rows: Array<OpenerScoreRow> =
            lessonIds.length === 0
                ? []
                : await this.entityManager.query(SELECT_OPENER_SCORES, [params.learnerId, lessonIds, LIST_ROWS_MAX])
        return lessonIds.map((lessonId) => {
            const questions = rows
                .filter((row) => row.lesson_id === lessonId)
                .map((row) => ({
                    activityId: row.activity_id,
                    firstCorrect: row.first_correct === true,
                    latestCorrect: row.latest_correct === true,
                    attempts: row.attempts,
                }))
            return {
                lessonId,
                answered: questions.length,
                firstCorrect: questions.filter((question) => question.firstCorrect).length,
                latestCorrect: questions.filter((question) => question.latestCorrect).length,
                questions,
            }
        })
    }
}
