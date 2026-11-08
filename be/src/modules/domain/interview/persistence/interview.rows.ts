import type {
    InterviewAccess,
    InterviewFamily,
    InterviewLocale,
    InterviewStatus,
    InterviewTier,
    InterviewVerdict,
    InterviewerMaterial,
    Localized,
    QuestionGrading,
    QuestionPrompt,
    SessionQuestion,
    TurnKind,
    TurnRole,
} from "../interview.contracts"
import type { GradedBy, Scorecard } from "../interview-view.contracts"

/** The content hash and status a stored bank version was written with. */
export interface BankHashRow {
    /** The content hash. */
    content_hash: string
    /** The status. */
    status: string
}

/** A published question as the draw sees it. */
export interface PoolRow {
    /** The question id. */
    question_id: string
    /** The bank id. */
    bank_id: string
    /** The live bank version. */
    bank_version: string
    /** The family. */
    family: InterviewFamily
    /** The tier. */
    tier: InterviewTier
    /** Whether the teacher marked it Premium. */
    is_premium: boolean
    /** The code languages it has bodies in. */
    body_languages: Array<string>
}

/** A live bank with its counts, for the options. */
export interface BankOptionRow {
    /** The bank id. */
    bank_id: string
    /** The family. */
    family: InterviewFamily
    /** The title in the locale asked. */
    title: string
    /** The difficulty. */
    difficulty: string
    /** The tiers it has questions for. */
    tiers: Array<InterviewTier>
    /** The code languages it has bodies in. */
    languages: Array<string>
    /** Its questions. */
    question_count: number
    /** Its free questions. */
    free_question_count: number
}

/** A question of a session with its grading data; it is read only for grading. */
export interface QuestionGradingRow {
    /** The bank id. */
    bank_id: string
    /** The bank version. */
    bank_version: string
    /** The question id. */
    question_id: string
    /** The family. */
    family: InterviewFamily
    /** The kind. */
    kind: string
    /** The public prompts by code language, then locale. */
    bodies: Record<string, Localized<QuestionPrompt>>
    /** The grading data. */
    grading: QuestionGrading
    /** The module slugs of the bank. */
    module_refs: Array<string>
}

/** One question of a published bank with its grading data, read for the calibration pre-check. */
export interface CalibrationRow {
    /** The question id. */
    question_id: string
    /** The family. */
    family: InterviewFamily
    /** The kind. */
    kind: string
    /** The public prompts by code language, then locale. */
    bodies: Record<string, Localized<QuestionPrompt>>
    /** The grading data. */
    grading: QuestionGrading
}

/** One session of the history. */
export interface HistoryRow {
    /** The session id. */
    session_id: string
    /** The track. */
    track: string
    /** The tier. */
    tier: InterviewTier
    /** When it started. */
    started_at: Date
    /** The status. */
    status: InterviewStatus
    /** The overall score. */
    overall_score: number | null
    /** The verdict. */
    verdict: InterviewVerdict | null
}

/** The best result of a learner for a track, family and tier. */
export interface EvidenceRow {
    /** The track. */
    track: string
    /** The family. */
    family: InterviewFamily
    /** The tier. */
    tier: InterviewTier
    /** The best score. */
    score: number
    /** The verdict of that result. */
    verdict: InterviewVerdict
    /** The session. */
    session_id: string
    /** When it was graded. */
    graded_at: Date
}

/** A count. */
export interface CountRow {
    /** The count. */
    count: number
}

/** One stored session. */
export interface SessionRow {
    /** The session id. */
    session_id: string
    /** The learner. */
    learner_id: string
    /** The idempotency key of the start. */
    client_request_id: string
    /** The track. */
    track: string
    /** The tier. */
    tier: InterviewTier
    /** The locale. */
    locale: InterviewLocale
    /** The code language asked. */
    language: string | null
    /** The number of questions. */
    length: number
    /** `free` or `premium`. */
    access: InterviewAccess
    /** The free month. */
    free_month: string | null
    /** The questions drawn. */
    questions: Array<SessionQuestion>
    /** The position of the open question. */
    current_position: number
    /** The status. */
    status: InterviewStatus
    /** The scorecard once graded. */
    scorecard: Scorecard | null
    /** The failure code of a failed grading. */
    failure_code: string | null
    /** The model that graded it. */
    graded_by: GradedBy | null
    /** When it started. */
    started_at: Date
    /** When it was graded. */
    graded_at: Date | null
    /** The overall score. */
    overall_score: number | null
    /** The verdict. */
    verdict: InterviewVerdict | null
}

/** One stored turn. */
export interface TurnRow {
    /** The turn id. */
    turn_id: string
    /** The session. */
    session_id: string
    /** The order in the session. */
    seq: number
    /** The question position. */
    position: number
    /** `interviewer` or `candidate`. */
    role: TurnRole
    /** What the turn is. */
    kind: TurnKind
    /** The text. */
    content: string
    /** The revision of a candidate answer. */
    revision: number | null
    /** True when the model produced it. */
    by_ai: boolean
    /** When it was stored. */
    created_at: Date
}

/** A question of a session with what the learner may read and what the interviewer may use. */
export interface QuestionPublicRow {
    /** The bank id. */
    bank_id: string
    /** The bank version. */
    bank_version: string
    /** The question id. */
    question_id: string
    /** The family. */
    family: InterviewFamily
    /** The tier. */
    tier: InterviewTier
    /** The kind. */
    kind: string
    /** The public prompts by code language, then locale. */
    bodies: Record<string, Localized<QuestionPrompt>>
    /** The follow-ups and hints per locale. */
    interviewer: Localized<InterviewerMaterial>
    /** The bank title per locale. */
    bank_titles: Localized<string>
    /** The module slugs of the bank. */
    module_refs: Array<string>
}
