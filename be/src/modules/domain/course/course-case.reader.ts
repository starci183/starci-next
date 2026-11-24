import type { EntityManager } from "typeorm"
import type { CaseMark, CaseRun } from "./course-case.policy"
import { SELECT_CASE_MARKS, SELECT_LATEST_CASE_RUNS } from "./persistence/course.sql"
import type { CourseCaseMarkRow, CourseCaseRunRow } from "./persistence/course.rows"

/** What the learner has done with every case of one lab. */
export const caseMarksOf = async (
    manager: EntityManager,
    learnerId: string,
    lessonId: string,
): Promise<ReadonlyArray<CaseMark>> => {
    const rows: Array<CourseCaseMarkRow> = await manager.query(SELECT_CASE_MARKS, [learnerId, lessonId])
    return rows.map((row) => ({ caseId: row.case_id, hintsOpened: row.hints_opened, everGreen: row.ever_green }))
}

/** The newest stored run of every case of one lab for the learner. */
export const latestRunsOf = async (
    manager: EntityManager,
    learnerId: string,
    lessonId: string,
): Promise<ReadonlyArray<CaseRun>> => {
    const rows: Array<CourseCaseRunRow> = await manager.query(SELECT_LATEST_CASE_RUNS, [learnerId, lessonId])
    return rows.map((row) => ({
        caseId: row.case_id,
        status: row.status,
        ranAt: row.ran_at.toISOString(),
        durationMs: row.duration_ms,
        learnerCommit: row.learner_commit,
        failed:
            row.failed === null
                ? null
                : {
                      invariant: row.failed.invariant,
                      message: row.failed.message,
                      expected: row.failed.expected ?? null,
                      actual: row.failed.actual ?? null,
                  },
    }))
}
