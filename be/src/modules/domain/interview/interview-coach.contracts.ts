import type {
    GradingMaterial,
    InterviewFamily,
    InterviewLocale,
    StarKey,
    TurnKind,
    TurnRole,
} from "./interview.contracts"
import type { GradedBy } from "./interview-view.contracts"

/** What the coach is asked to decide after a candidate answer. */
export interface InterviewerRequest {
    /** An opaque id that names no learner. */
    readonly requestId: string
    /** The locale of the interview. */
    readonly locale: InterviewLocale
    /** The family of the open question. */
    readonly family: InterviewFamily
    /** The open question. */
    readonly prompt: string
    /** The code or the diagram the learner reads, or empty. */
    readonly material: string
    /** The authored follow-ups. */
    readonly followUps: ReadonlyArray<string>
    /** How many follow-ups or probes were already asked. */
    readonly asked: number
    /** The turns of this question so far. */
    readonly transcript: ReadonlyArray<{ readonly role: TurnRole; readonly kind: TurnKind; readonly content: string }>
    /** The deadline in milliseconds. */
    readonly timeoutMs: number
}

/** What the interviewer decided. */
export interface InterviewerDecision {
    /** Ask a follow-up, ask a probe, or move on. */
    readonly action: "followUp" | "probe" | "next"
    /** The text to say; empty when moving on. */
    readonly text: string
}

/** One question to grade, with its transcript and its grading data. */
export interface GradingQuestion {
    /** The position. */
    readonly position: number
    /** The question id. */
    readonly questionId: string
    /** The family. */
    readonly family: InterviewFamily
    /** The kind. */
    readonly kind: string
    /** The question prompt. */
    readonly prompt: string
    /** The grading material in the session locale. */
    readonly material: GradingMaterial
    /** The ideal answer in the session language and locale; empty for a behavioural question. */
    readonly idealAnswer: string
    /** The turns of the question. */
    readonly transcript: ReadonlyArray<{ readonly role: TurnRole; readonly kind: TurnKind; readonly content: string }>
}

/** What the coach is asked to grade. */
export interface GraderRequest {
    /** An opaque id that names no learner. */
    readonly requestId: string
    /** The locale of the interview. */
    readonly locale: InterviewLocale
    /** The answered questions. */
    readonly questions: ReadonlyArray<GradingQuestion>
    /** The reason the previous reply was refused, when this is the second try. */
    readonly previousProblem: string | null
    /** The deadline in milliseconds. */
    readonly timeoutMs: number
}

/** One checklist hit the grader reported. */
export interface ChecklistHit {
    /** The checklist index. */
    readonly item: number
    /** Whether the answer showed it. */
    readonly hit: boolean
    /** The learner's words. */
    readonly evidenceQuote: string
}

/** One STAR level the grader reported. */
export interface DimensionLevel {
    /** The dimension. */
    readonly key: StarKey
    /** 0 to 4. */
    readonly level: number
    /** The learner's words. */
    readonly evidenceQuote: string
}

/** The grader's reading of one question. */
export interface GradedQuestion {
    /** The position. */
    readonly position: number
    /** The checklist hits of a technical question. */
    readonly checklist: ReadonlyArray<ChecklistHit>
    /** The STAR levels of a behavioural question. */
    readonly dimensions: ReadonlyArray<DimensionLevel>
    /** Whether the answer leaned on "we" with no concrete action of the learner. */
    readonly ownershipWeak: boolean
    /** A short note on what the answer missed. */
    readonly note: string
}

/** The grader's reading of a session, before the server scores it. */
export interface GraderReply {
    /** One entry per answered question. */
    readonly questions: ReadonlyArray<GradedQuestion>
    /** The model that answered. */
    readonly gradedBy: GradedBy
}
