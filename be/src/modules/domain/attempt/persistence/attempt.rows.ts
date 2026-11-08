import type { LessonLocale, LessonPhase } from "@modules/domain/lesson"
import type { AttemptAnswer, AttemptKind, AttemptResult, AttemptStatus } from "../attempt.contracts"

/** One stored attempt: the answer as normalized, where grading stands and the result once there is one. */
export interface AttemptRow {
    /** The attempt id. */
    attempt_id: string
    /** The learner. */
    learner_id: string
    /** The lesson. */
    lesson_id: string
    /** The version the learner studies. */
    lesson_version: string
    /** The activity. */
    activity_id: string
    /** The revision of the answer to the activity. */
    revision: number
    /** What the activity asks. */
    kind: AttemptKind
    /** The phase of the activity. */
    phase: LessonPhase
    /** The locale of the text of the learner and of the feedback. */
    locale: LessonLocale
    /** Whether the activity is a diagnostic. */
    is_diagnostic: boolean
    /** The normalized answer. */
    answer: AttemptAnswer
    /** Where the attempt stands. */
    status: AttemptStatus
    /** The grade once graded, otherwise null. */
    result: AttemptResult | null
    /** The code of a failed grading, otherwise null. */
    failure_code: string | null
    /** When the answer was stored. */
    submitted_at: Date
    /** When the attempt was graded, otherwise null. */
    graded_at: Date | null
}

/** A stored attempt found again by its revision, with whether a resent answer equals the stored one. */
export interface ReplayRow extends AttemptRow {
    /** True when the resent answer is the stored answer. */
    same_answer: boolean
}

/** The levels of one outcome of one learner in one lesson. */
export interface OutcomeRow {
    /** The outcome id. */
    outcome_id: string
    /** What the learner showed to understand. */
    understood: number
    /** What the learner proved by applying it. */
    proved: number
}

/** The newest attempt of one activity and how many attempts the activity has. */
export interface ActivityProgressRow {
    /** The activity. */
    activity_id: string
    /** Its phase. */
    phase: LessonPhase
    /** What it asks. */
    kind: AttemptKind
    /** The version of the newest attempt. */
    lesson_version: string
    /** The newest attempt. */
    attempt_id: string
    /** Its revision. */
    revision: number
    /** Its status. */
    status: AttemptStatus
    /** When it was stored. */
    submitted_at: Date
    /** How many attempts the activity has. */
    attempts: number
}
