import type { LessonLocale, LessonPhase } from "@modules/domain/lesson"
import type { AttemptAnswer, AttemptKind, AttemptStatus, StoredAttemptResult } from "../attempt.contracts"

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
    result: StoredAttemptResult | null
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

/** The best incident mutation score a learner holds in a lesson. */
export interface IncidentScoreRow {
    /** The score in percent, 0 to 100. */
    mutation_score: number
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

/** The newest attempt of one activity, whole, and how many attempts the activity has. */
export interface ActivityProgressRow extends AttemptRow {
    /** How many attempts the activity has. */
    attempts: number
}

/** When a learner finished a lesson. */
export interface CompletionRow {
    /** The version finished. */
    lesson_version: string
    /** The instant. */
    completed_at: Date
}

/** Where a learner stands in a simulation. */
export interface SimulationProgressRow {
    /** The simulation activity. */
    activity_id: string
    /** The state the learner is in. */
    current_state_id: string
    /** The actions of the current path. */
    action_ids: Array<string>
    /** Every transition ever taken. */
    tried_transition_ids: Array<string>
    /** When it last changed. */
    updated_at: Date
}

/** The first and the newest graded answer of one opener question. */
export interface OpenerScoreRow {
    /** The lesson. */
    lesson_id: string
    /** The activity, `opener.<question id>`. */
    activity_id: string
    /** Whether the first graded answer was right. */
    first_correct: boolean | null
    /** Whether the newest graded answer is right. */
    latest_correct: boolean | null
    /** The graded answers given. */
    attempts: number
}

/** One scenario hint a learner asked for. */
export interface HintUseRow {
    /** The lesson. */
    lesson_id: string
    /** The scenario. */
    scenario_id: string
}

/** One section a learner marked as read. */
export interface SectionReadRow {
    /** The section. */
    section_id: string
}

/** The newest graded answer of one challenge essence question. */
export interface ChallengeChoiceRow {
    /** The lesson. */
    lesson_id: string
    /** The activity, `challenge.<challenge id>.<question id>`. */
    activity_id: string
    /** Whether the newest graded answer is right. */
    latest_correct: boolean | null
}
