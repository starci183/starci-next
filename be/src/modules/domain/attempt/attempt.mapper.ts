import type { LessonPhase } from "@modules/domain/lesson"
import type { LessonReviewSlotView } from "@modules/domain/review"
import type {
    ActivityProgressView,
    AttemptResult,
    AttemptSummaryView,
    AttemptView,
    LessonProgressView,
    OutcomeStateView,
    PhaseProgressView,
    SimulationProgressView,
    StoredAttemptResult,
} from "./attempt.contracts"
import type { ActivityProgressRow, AttemptRow, SimulationProgressRow } from "./persistence/attempt.rows"

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

/** A result as stored may predate the grader notes: every criterion then reads an empty note. */
const withNotes = (result: StoredAttemptResult | null): AttemptResult | null =>
    result === null
        ? null
        : {
              ...result,
              criteria: result.criteria.map((criterion) => ({ ...criterion, missing: criterion.missing ?? "" })),
          }

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
    answer: row.answer,
    result: withNotes(row.result),
    failureCode: row.failure_code,
    submittedAt: row.submitted_at.toISOString(),
    gradedAt: row.graded_at === null ? null : row.graded_at.toISOString(),
})

const toActivityView = (row: ActivityProgressRow): ActivityProgressView => ({
    activityId: row.activity_id,
    phase: row.phase,
    kind: row.kind,
    attempts: row.attempts,
    latestAttemptId: row.attempt_id,
    latestRevision: row.revision,
    latestStatus: row.status,
    latest: toAttemptView(row),
})

const furthestPhaseOf = (rows: ReadonlyArray<ActivityProgressRow>): LessonPhase =>
    rows.reduce<LessonPhase>(
        (furthest, row) => (PHASE_ORDER.indexOf(row.phase) > PHASE_ORDER.indexOf(furthest) ? row.phase : furthest),
        FIRST_PHASE,
    )

/** The version of the newest attempt, or null before any attempt. */
export const newestVersionOf = (rows: ReadonlyArray<ActivityProgressRow>): string | null =>
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

/** What a progress is assembled from. */
export interface ProgressParts {
    /** The lesson. */
    readonly lessonId: string
    /** The outcomes with their levels and state. */
    readonly outcomes: ReadonlyArray<OutcomeStateView>
    /** The phases. */
    readonly phases: ReadonlyArray<PhaseProgressView>
    /** The newest attempt of each activity. */
    readonly activities: ReadonlyArray<ActivityProgressRow>
    /** When the lesson was finished, or null. */
    readonly completedAt: Date | null
    /** The simulation progress rows. */
    readonly simulations: ReadonlyArray<SimulationProgressRow>
    /** The reviews the completion opened. */
    readonly reviews: ReadonlyArray<LessonReviewSlotView>
}

/** Assembles the progress of a learner in a lesson from its parts. */
export const toProgressView = (parts: ProgressParts): LessonProgressView => ({
    lessonId: parts.lessonId,
    version: newestVersionOf(parts.activities),
    phase: furthestPhaseOf(parts.activities),
    outcomes: parts.outcomes,
    phases: parts.phases,
    completedAt: parts.completedAt === null ? null : parts.completedAt.toISOString(),
    simulations: parts.simulations.map((row) => toSimulationView(row)),
    reviews: parts.reviews,
    attempts: summaryOf(parts.activities),
    activities: parts.activities.map((row) => toActivityView(row)),
})

/** Maps a stored simulation position to its view. */
export const toSimulationView = (row: SimulationProgressRow): SimulationProgressView => ({
    activityId: row.activity_id,
    currentStateId: row.current_state_id,
    actionIds: row.action_ids,
    triedTransitionIds: row.tried_transition_ids,
    updatedAt: row.updated_at.toISOString(),
})
