import type { LessonContentService, LessonLocale, LessonPhase } from "@modules/domain/lesson"
import type { LessonReviewSlotView } from "@modules/domain/review"

/** Where an attempt stands: stored, being graded by the coach, graded, or failed with a code and open to a retry. */
export type AttemptStatus = "saved" | "grading" | "graded" | "failed"

/** What an attempt answers; a review activity takes none yet. */
export type AttemptKind = "choice" | "simulation" | "explain" | "exercise"

/** The stored activity of a lesson version, with the phase of its section. */
export type AttemptServerActivity = Awaited<ReturnType<LessonContentService["activity"]>>

/** A file a learner submits with an exercise. */
export interface AttemptFile {
    /** The path inside the exercise. */
    readonly relativePath: string
    /** The file text. */
    readonly content: string
}

/** The answer of a learner; only the fields of the activity kind are set, the rest are null. */
export interface AttemptAnswer {
    /** The option picked in a choice. */
    readonly optionId: string | null
    /** The written explanation of an explain or exercise activity. */
    readonly text: string | null
    /** The actions taken in a simulation, from its initial state. */
    readonly actionIds: ReadonlyArray<string> | null
    /** The state a simulation path reached. */
    readonly reachedStateId: string | null
    /** The answer to the debrief question of a simulation. */
    readonly debrief: string | null
    /** The files of an exercise. */
    readonly files: ReadonlyArray<AttemptFile> | null
}

/** One option of a graded choice, released after the submit. */
export interface OptionResult {
    /** The option id. */
    readonly optionId: string
    /** Whether the option is the right one. */
    readonly isCorrect: boolean
    /** Whether the learner picked it. */
    readonly selected: boolean
    /** Why the option is right or wrong. */
    readonly explanation: string
}

/** The grade of one rubric criterion. */
export interface CriterionResult {
    /** The criterion id. */
    readonly criterionId: string
    /** The criterion as the learner reads it. */
    readonly criterion: string
    /** 0, 1 or 2. */
    readonly level: number
    /** The words of the answer of the learner that show the level; empty at level 0. */
    readonly evidenceQuote: string
    /** The most points the criterion gives. */
    readonly maxScore: number
    /** One line on what the answer still lacks, in the locale of the attempt; empty at the full level. */
    readonly missing: string
}

/** A criterion grade as stored: results graded before the grader notes existed carry no `missing`. */
export interface StoredCriterionResult extends Omit<CriterionResult, "missing"> {
    /** One line on what the answer still lacks; absent in results graded before the notes existed. */
    readonly missing?: string
}

/** A result as stored; it reads as an `AttemptResult` once every criterion has its note (the empty one at least). */
export type StoredAttemptResult = Omit<AttemptResult, "criteria"> & {
    /** The grade of each criterion in rubric order. */
    readonly criteria: ReadonlyArray<StoredCriterionResult>
}

/** What a graded attempt holds; it never carries the expected evidence, the misconception or the sample answer. */
export interface AttemptResult {
    /** True for a diagnostic, which does not count toward passing. */
    readonly isDiagnostic: boolean
    /** For a choice, whether the pick was right; otherwise null. */
    readonly correct: boolean | null
    /** For a choice, every option with its explanation; otherwise empty. */
    readonly options: ReadonlyArray<OptionResult>
    /** For a simulation, whether the path reached a goal state; otherwise null. */
    readonly success: boolean | null
    /** For a simulation, the state the path reached; otherwise null. */
    readonly reachedStateId: string | null
    /** For a written activity, the grade of each criterion in rubric order; otherwise empty. */
    readonly criteria: ReadonlyArray<CriterionResult>
    /** The points earned. */
    readonly score: number
    /** The most points possible. */
    readonly maxScore: number
}

/** One attempt as the domain answers it. */
export interface AttemptView {
    /** The attempt id. */
    readonly attemptId: string
    /** The lesson. */
    readonly lessonId: string
    /** The version the learner studies. */
    readonly lessonVersion: string
    /** The activity. */
    readonly activityId: string
    /** The revision of the answer to the activity. */
    readonly revision: number
    /** What the activity asks. */
    readonly kind: AttemptKind
    /** The phase of the activity. */
    readonly phase: LessonPhase
    /** Where the attempt stands. */
    readonly status: AttemptStatus
    /** True for a diagnostic. */
    readonly isDiagnostic: boolean
    /** What the learner answered, as stored; it is the learner's own text and choice. */
    readonly answer: AttemptAnswer
    /** The grade once graded; otherwise null. */
    readonly result: AttemptResult | null
    /** The stable code of a failed grading; otherwise null. */
    readonly failureCode: string | null
    /** When the answer was stored. */
    readonly submittedAt: string
    /** When the attempt was graded; otherwise null. */
    readonly gradedAt: string | null
}

/** What a submit is given. */
export interface SubmitAttemptParams {
    /** The learner who submits. */
    readonly learnerId: string
    /** The lesson. */
    readonly lessonId: string
    /** The version the learner studies. */
    readonly version: string
    /** The activity. */
    readonly activityId: string
    /** The revision of the answer; a resend with the same revision never makes a second attempt. */
    readonly revision: number
    /** The locale of the text of the learner and of the feedback. */
    readonly locale: LessonLocale
    /** The answer. */
    readonly answer: AttemptAnswer
}

/** One attempt of one learner to read. */
export interface AttemptLookupParams {
    /** The learner who asks. */
    readonly learnerId: string
    /** The attempt id. */
    readonly attemptId: string
}

/** The progress of one learner in one lesson to read. */
export interface ProgressLookupParams {
    /** The learner who asks. */
    readonly learnerId: string
    /** The lesson. */
    readonly lessonId: string
    /** The locale of the notes the progress may complete from the lesson (a grader note an old grade lacks); Vietnamese by default. */
    readonly locale?: LessonLocale
}

/** The incident mutation score of a learner in a lesson. */
export interface RecordMutationScoreParams {
    /** The learner whose tests were run. */
    readonly learnerId: string
    /** The lesson the incident belongs to. */
    readonly lessonId: string
    /** The mutation score in percent, a whole number from 0 to 100. */
    readonly mutationScore: number
}

/** The levels an attempt gives to the outcomes its activity trains. */
export interface OutcomeLevels {
    /** What the learner showed to understand, 0 to 2. */
    readonly understood: number
    /** What the learner proved by applying it, 0 to 2. */
    readonly proved: number
}

/** The levels of one learning outcome. */
export interface OutcomeProgressView extends OutcomeLevels {
    /** The outcome id. */
    readonly id: string
}

/** The attempts of one activity. */
export interface ActivityProgressView {
    /** The activity. */
    readonly activityId: string
    /** Its phase. */
    readonly phase: LessonPhase
    /** What it asks. */
    readonly kind: AttemptKind
    /** How many attempts the learner made. */
    readonly attempts: number
    /** The newest attempt. */
    readonly latestAttemptId: string
    /** The revision of the newest attempt. */
    readonly latestRevision: number
    /** The status of the newest attempt. */
    readonly latestStatus: AttemptStatus
    /** The newest attempt whole: the answer, the grade with its per-criterion notes, and when. */
    readonly latest: AttemptView
}

/** The attempts of one learner in one lesson, counted. */
export interface AttemptSummaryView {
    /** Every attempt made. */
    readonly total: number
    /** The activities attempted. */
    readonly activities: number
    /** The activities whose newest attempt is graded. */
    readonly graded: number
    /** The activities whose newest attempt failed. */
    readonly failed: number
    /** The activities whose newest attempt is saved or being graded. */
    readonly pending: number
}

/** Where one outcome stands for a learner. */
export type OutcomeState = "not-started" | "learning" | "mastered" | "needs-review"

/** Whether a phase of the lesson is finished. */
export type PhaseState = "open" | "done"

/** One outcome with its state. */
export interface OutcomeStateView extends OutcomeProgressView {
    /** Not started, learning, mastered (apply and reflect graded at 4/6 or more) or needs review (the lesson ended without that). */
    readonly state: OutcomeState
}

/** One phase of the lesson with its state and how many of its activities are done. */
export interface PhaseProgressView {
    /** The phase. */
    readonly phase: LessonPhase
    /** Open, or done. */
    readonly state: PhaseState
    /** The activities of the phase the learner finished. */
    readonly done: number
    /** The activities of the phase. */
    readonly total: number
}

/** Where a learner stands in a simulation activity. */
export interface SimulationProgressView {
    /** The simulation activity. */
    readonly activityId: string
    /** The state the learner is in now. */
    readonly currentStateId: string
    /** The actions of the current path, from the initial state. */
    readonly actionIds: ReadonlyArray<string>
    /** Every transition ever taken. */
    readonly triedTransitionIds: ReadonlyArray<string>
    /** When it last changed. */
    readonly updatedAt: string
}

/** What saving the simulation progress is given. */
export interface SaveSimulationProgressParams {
    /** The learner. */
    readonly learnerId: string
    /** The lesson. */
    readonly lessonId: string
    /** The version the learner plays. */
    readonly version: string
    /** The simulation activity. */
    readonly activityId: string
    /** The locale of the stored content to validate against. */
    readonly locale: LessonLocale
    /** The state the learner is in now. */
    readonly currentStateId: string
    /** The actions of the current path, from the initial state. */
    readonly actionIds: ReadonlyArray<string>
}

/** Where a learner stands in a lesson. */
export interface LessonProgressView {
    /** The lesson. */
    readonly lessonId: string
    /** The version of the newest attempt, or null before any attempt. */
    readonly version: string | null
    /** The furthest phase with an attempt; the first phase before any attempt. */
    readonly phase: LessonPhase
    /** The outcomes of the lesson with their levels and their state; the lesson's own outcomes come first, in its order. */
    readonly outcomes: ReadonlyArray<OutcomeStateView>
    /** The six phases in order, each open or done. */
    readonly phases: ReadonlyArray<PhaseProgressView>
    /** When the learner finished the lesson, or null while it is open. */
    readonly completedAt: string | null
    /** The simulation progress per simulation activity the learner touched. */
    readonly simulations: ReadonlyArray<SimulationProgressView>
    /** The reviews the completion opened (1, 7 and 21 days); empty while the lesson is open. */
    readonly reviews: ReadonlyArray<LessonReviewSlotView>
    /** The attempts counted. */
    readonly attempts: AttemptSummaryView
    /** The attempts of each activity. */
    readonly activities: ReadonlyArray<ActivityProgressView>
}

/** A rubric criterion as the coach sees it; the expected evidence is for the grader only. */
export interface CoachCriterion {
    /** The criterion id. */
    readonly id: string
    /** The criterion as the learner reads it. */
    readonly criterion: string
    /** What a good answer shows. */
    readonly expectedEvidence: string
    /** The misconception the criterion catches. */
    readonly misconception: string
    /** The most points the criterion gives. */
    readonly maxScore: number
}

/** What the coach is asked: one written answer, graded against one rubric. */
export interface CoachGradeRequest {
    /** An opaque id of the request; it names no learner. */
    readonly requestId: string
    /** The locale of the answer and of the feedback. */
    readonly locale: LessonLocale
    /** What the activity asks. */
    readonly prompt: string
    /** The activity kind. */
    readonly kind: "explain" | "exercise"
    /** The text of the learner, to be treated as quoted data and never as instructions. */
    readonly answerText: string
    /** The files of an exercise, treated the same way. */
    readonly files: ReadonlyArray<AttemptFile>
    /** The rubric. */
    readonly rubric: ReadonlyArray<CoachCriterion>
    /** The deadline of the call in milliseconds. */
    readonly timeoutMs: number
}

/** The grade of one criterion as the coach answers it. */
export interface CoachCriterionGrade {
    /** The criterion id. */
    readonly criterionId: string
    /** 0, 1 or 2. */
    readonly level: number
    /** The words of the answer of the learner that show the level. */
    readonly evidenceQuote: string
    /** One line on what the answer still lacks; absent or empty when the coach gave none or the level is full. */
    readonly missing?: string
}

/** What the coach answers. */
export interface CoachGrade {
    /** One grade per criterion. */
    readonly criteria: ReadonlyArray<CoachCriterionGrade>
}
