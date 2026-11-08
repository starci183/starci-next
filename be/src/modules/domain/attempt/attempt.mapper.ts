import type { LessonPhase } from "@modules/domain/lesson"
import type {
    ActivityProgressView,
    AttemptSummaryView,
    AttemptView,
    LessonProgressView,
    OutcomeProgressView,
} from "./attempt.contracts"
import type { ActivityProgressRow, AttemptRow, OutcomeRow } from "./persistence/attempt.rows"

/** The phases of a lesson in the order a learner meets them. */
export const PHASE_ORDER: ReadonlyArray<LessonPhase> = [
    "challenge",
    "predict",
    "explore",
    "explain",
    "apply",
    "reflect",
]

/** The first phase, where a learner stands before any attempt. */
const FIRST_PHASE: LessonPhase = "challenge"

/** Maps a stored attempt to the view the domain answers. */
export const toAttemptView = (row: AttemptRow): AttemptView => ({
    attemptId: row.attempt_id,
    lessonId: row.lesson_id,
    lessonVersion: row.lesson_version,
    activityId: row.activity_id,
    revision: row.revision,
    kind: row.kind,
    phase: row.phase,
    status: row.status,
    isDiagnostic: row.is_diagnostic,
    result: row.result,
    failureCode: row.failure_code,
    submittedAt: row.submitted_at.toISOString(),
    gradedAt: row.graded_at === null ? null : row.graded_at.toISOString(),
})

const toOutcomeView = (row: OutcomeRow): OutcomeProgressView => ({
    id: row.outcome_id,
    understood: row.understood,
    proved: row.proved,
})

const toActivityView = (row: ActivityProgressRow): ActivityProgressView => ({
    activityId: row.activity_id,
    phase: row.phase,
    kind: row.kind,
    attempts: row.attempts,
    latestAttemptId: row.attempt_id,
    latestRevision: row.revision,
    latestStatus: row.status,
})

const furthestPhaseOf = (rows: ReadonlyArray<ActivityProgressRow>): LessonPhase =>
    rows.reduce<LessonPhase>(
        (furthest, row) => (PHASE_ORDER.indexOf(row.phase) > PHASE_ORDER.indexOf(furthest) ? row.phase : furthest),
        FIRST_PHASE,
    )

const newestVersionOf = (rows: ReadonlyArray<ActivityProgressRow>): string | null =>
    rows.reduce<ActivityProgressRow | null>(
        (newest, row) => (newest === null || row.submitted_at > newest.submitted_at ? row : newest),
        null,
    )?.lesson_version ?? null

const summaryOf = (rows: ReadonlyArray<ActivityProgressRow>): AttemptSummaryView => ({
    total: rows.reduce((total, row) => total + row.attempts, 0),
    activities: rows.length,
    graded: rows.filter((row) => row.status === "graded").length,
    failed: rows.filter((row) => row.status === "failed").length,
    pending: rows.filter((row) => row.status === "saved" || row.status === "grading").length,
})

/** Assembles the progress of a learner in a lesson from the outcome levels and the newest attempt of each activity. */
export const toProgressView = (
    lessonId: string,
    outcomes: ReadonlyArray<OutcomeRow>,
    activities: ReadonlyArray<ActivityProgressRow>,
): LessonProgressView => ({
    lessonId,
    version: newestVersionOf(activities),
    phase: furthestPhaseOf(activities),
    outcomes: outcomes.map((row) => toOutcomeView(row)),
    attempts: summaryOf(activities),
    activities: activities.map((row) => toActivityView(row)),
})
