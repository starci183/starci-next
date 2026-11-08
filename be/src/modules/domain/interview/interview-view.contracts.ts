import type {
    InterviewAccess,
    InterviewFamily,
    InterviewLocale,
    InterviewStatus,
    InterviewTier,
    InterviewVerdict,
    StarKey,
    TechnicalDimension,
    TurnKind,
    TurnRole,
} from "./interview.contracts"

/** The setup of a session. */
export interface InterviewSetup {
    /** The outcome track. */
    readonly track: string
    /** The tier. */
    readonly tier: InterviewTier
    /** The locale of the prompts and the feedback. */
    readonly locale: InterviewLocale
    /** The code language chosen, or null for each question's own default. */
    readonly language: string | null
    /** How many questions. */
    readonly length: number
    /** Free or Premium. */
    readonly access: InterviewAccess
}

/** One turn as the learner reads it. */
export interface TurnView {
    /** The turn id. */
    readonly turnId: string
    /** The question position. */
    readonly position: number
    /** Who spoke. */
    readonly role: TurnRole
    /** What it is. */
    readonly kind: TurnKind
    /** The text. */
    readonly content: string
    /** The revision of a candidate answer, or null. */
    readonly revision: number | null
    /** When it was stored. */
    readonly createdAt: string
}

/** One question as the learner reads it while the interview runs: prompt material only. */
export interface QuestionView {
    /** The position. */
    readonly position: number
    /** The family. */
    readonly family: InterviewFamily
    /** The tier. */
    readonly tier: InterviewTier
    /** The kind. */
    readonly kind: string
    /** The title of the bank. */
    readonly bankTitle: string
    /** The question. */
    readonly prompt: string
    /** The code to read, or null. */
    readonly givenCode: string | null
    /** The diagram to read, or null. */
    readonly diagram: string | null
    /** The code language of the body, `agnostic` when it has none. */
    readonly bodyLanguage: string
    /** How many hints the question has. */
    readonly hintCount: number
}

/** One checklist item graded, released only with the scorecard. */
export interface ChecklistResult {
    /** What a strong answer says. */
    readonly text: string
    /** The dimension. */
    readonly dimension: TechnicalDimension
    /** Whether it is critical. */
    readonly critical: boolean
    /** The points it gives when hit. */
    readonly scoreBand: number
    /** Whether the answer showed it. */
    readonly hit: boolean
    /** The learner's own words that show it; empty when not hit. */
    readonly evidenceQuote: string
}

/** One STAR dimension graded. */
export interface DimensionResult {
    /** The dimension. */
    readonly key: StarKey
    /** What good looks like for this question. */
    readonly text: string
    /** 0 to 4. */
    readonly level: number
    /** The learner's own words that show the level; empty at level 0. */
    readonly evidenceQuote: string
}

/** The grade of one question. */
export interface QuestionScore {
    /** The position. */
    readonly position: number
    /** The question id. */
    readonly questionId: string
    /** The family. */
    readonly family: InterviewFamily
    /** Whether the learner skipped it. */
    readonly skipped: boolean
    /** 0 to 100, after the hint penalty. */
    readonly score: number
    /** How many hints the learner used. */
    readonly hintsUsed: number
    /** The points taken off for hints. */
    readonly hintPenalty: number
    /** The critical checklist items the answer missed. */
    readonly criticalMissed: ReadonlyArray<string>
    /** The checklist of a technical question. */
    readonly checklist: ReadonlyArray<ChecklistResult>
    /** The STAR dimensions of a behavioural question. */
    readonly dimensions: ReadonlyArray<DimensionResult>
    /** Whether the grader flagged a weak ownership signal, which took points off. */
    readonly ownershipWeak: boolean
    /** A short note on what the answer missed. */
    readonly note: string
    /** The teacher's ideal answer in the code language and locale of the session; empty for a behavioural question. */
    readonly idealAnswer: string
}

/** The score of one attribute. */
export interface AttributeScore {
    /** The attribute: a technical dimension or a STAR key. */
    readonly key: string
    /** 0 to 100. */
    readonly score: number
}

/** The scorecard of a graded session. */
export interface Scorecard {
    /** 0 to 100 across every graded question. */
    readonly overallScore: number
    /** The verdict of the session. */
    readonly verdict: InterviewVerdict
    /** The technical pillar score, or null when no technical question was graded. */
    readonly technicalScore: number | null
    /** The verdict of the technical pillar, or null. */
    readonly technicalVerdict: InterviewVerdict | null
    /** The behavioural pillar score, or null. */
    readonly behavioralScore: number | null
    /** The verdict of the behavioural pillar, or null. */
    readonly behavioralVerdict: InterviewVerdict | null
    /** The score of each technical dimension and each STAR dimension. */
    readonly attributes: ReadonlyArray<AttributeScore>
    /** The questions graded, in order. */
    readonly questions: ReadonlyArray<QuestionScore>
    /** What went well. */
    readonly strengths: ReadonlyArray<string>
    /** What to study again, each with the Essentials module it comes from. */
    readonly gaps: ReadonlyArray<Gap>
}

/** One thing to study again. */
export interface Gap {
    /** What the answer missed. */
    readonly text: string
    /** The position of the question. */
    readonly position: number
    /** The module slugs of the bank, which the report maps to Essentials lessons. */
    readonly moduleRefs: ReadonlyArray<string>
}

/** A lesson the report links to. */
export interface LessonLink {
    /** The lesson id. */
    readonly lessonId: string
    /** The topic the lesson sits under; the lesson route is `/essentials/{topic}/{lesson}`. */
    readonly topic: string
    /** The title in the session locale. */
    readonly title: string
}

/** The model that graded a session, for calibration; never shown as credits. */
export interface GradedBy {
    /** The routing profile. */
    readonly profile: string
    /** The model id that answered. */
    readonly model: string
    /** Whether a fallback model answered instead of the preferred one. */
    readonly usedFallback: boolean
}

/** A session as the learner reads it. */
export interface SessionView {
    /** The session id. */
    readonly sessionId: string
    /** The setup. */
    readonly setup: InterviewSetup
    /** Where it stands. */
    readonly status: InterviewStatus
    /** The position of the open question. */
    readonly position: number
    /** The questions with their prompt material. */
    readonly questions: ReadonlyArray<QuestionView>
    /** Every turn in order. */
    readonly turns: ReadonlyArray<TurnView>
    /** The scorecard, only once graded. */
    readonly scorecard: Scorecard | null
    /** The lessons each gap links to, by module slug, only once graded. */
    readonly lessons: LessonsByModule
    /** The overall score of the learner's previous graded session on the same track and tier, only once graded, or null. */
    readonly previousScore: number | null
    /** The model that graded it, only once graded. */
    readonly gradedBy: GradedBy | null
    /** The stable code of a failed grading, or null. */
    readonly failureCode: string | null
    /** When it started. */
    readonly startedAt: string
    /** When it was graded, or null. */
    readonly gradedAt: string | null
}

/** What `answer` gives back. */
export interface AnswerView {
    /** The stored candidate turn. */
    readonly saved: TurnView
    /** The interviewer turn that followed, or null when it could not be produced. */
    readonly next: TurnView | null
    /** The session status. */
    readonly status: InterviewStatus
    /** The stable code of the failed interviewer step, or null. */
    readonly failureCode: string | null
}

/** What `submit` and `regrade` give back. */
export interface GradingView {
    /** The session id. */
    readonly sessionId: string
    /** The status after grading. */
    readonly status: InterviewStatus
    /** The stable code of a failed grading, or null. */
    readonly failureCode: string | null
}

/** What `abandon` gives back. */
export interface AbandonView {
    /** The session id. */
    readonly sessionId: string
    /** Always abandoned. */
    readonly status: "abandoned"
}

/** One bank in the options. */
export interface BankOption {
    /** The bank id. */
    readonly bankId: string
    /** The family. */
    readonly family: InterviewFamily
    /** The title. */
    readonly title: string
    /** The difficulty. */
    readonly difficulty: string
    /** The tiers the bank has questions for. */
    readonly tiers: ReadonlyArray<InterviewTier>
    /** The code languages its questions have bodies in. */
    readonly languages: ReadonlyArray<string>
    /** How many questions it holds. */
    readonly questionCount: number
    /** How many of them are free. */
    readonly freeQuestionCount: number
}

/** One track in the options. */
export interface TrackOption {
    /** The track id. */
    readonly id: string
    /** The title in the locale asked. */
    readonly title: string
}

/** What a learner may do with the interview right now. */
export interface InterviewAccessView {
    /** Whether the learner holds Premium. */
    readonly isPremium: boolean
    /** The free sessions left this month; zero under Premium is not shown. */
    readonly freeSessionsLeftThisMonth: number
    /** When the free quota resets. */
    readonly resetsAt: string
    /** How many questions a session of this learner has. */
    readonly length: number
}

/** The options of the interview home. */
export interface InterviewOptionsView {
    /** The tracks. */
    readonly tracks: ReadonlyArray<TrackOption>
    /** The banks of the track asked, or of every track. */
    readonly banks: ReadonlyArray<BankOption>
    /** The access of the learner. */
    readonly access: InterviewAccessView
    /** The session in progress, or null. */
    readonly active: HistoryItem | null
}

/** One session in the history. */
export interface HistoryItem {
    /** The session id. */
    readonly sessionId: string
    /** The track. */
    readonly track: string
    /** The tier. */
    readonly tier: InterviewTier
    /** When it started. */
    readonly startedAt: string
    /** The status. */
    readonly status: InterviewStatus
    /** The overall score once graded. */
    readonly overallScore: number | null
    /** The verdict once graded. */
    readonly verdict: InterviewVerdict | null
}

/** The scores of one track and tier over time, oldest first. */
export interface TrendView {
    /** The track. */
    readonly track: string
    /** The tier. */
    readonly tier: InterviewTier
    /** The overall scores of the graded sessions. */
    readonly scores: ReadonlyArray<number>
}

/** The history of a learner. */
export interface HistoryView {
    /** The sessions, newest first. */
    readonly items: ReadonlyArray<HistoryItem>
    /** The trend per track and tier. */
    readonly trend: ReadonlyArray<TrendView>
}

/** The best graded result of a learner for one track, family and tier: interview evidence for the profile and the path. */
export interface EvidenceItem {
    /** The track. */
    readonly track: string
    /** The family (pillar). */
    readonly family: InterviewFamily
    /** The tier. */
    readonly tier: InterviewTier
    /** The best score. */
    readonly bestScore: number
    /** The verdict of that result. */
    readonly verdict: InterviewVerdict
    /** The session that earned it. */
    readonly sessionId: string
    /** When it was graded. */
    readonly gradedAt: string
}

/** One pillar of the hiring readiness. */
export interface ReadinessPillar {
    /** The best score. */
    readonly bestScore: number
    /** The best verdict. */
    readonly verdict: InterviewVerdict
}

/** The hiring readiness a learner has from the mock interview at one track and tier. */
export interface ReadinessView {
    /** The track. */
    readonly track: string
    /** The tier. */
    readonly tier: InterviewTier
    /** The technical pillar, or null before a graded session. */
    readonly technical: ReadinessPillar | null
    /** The behavioural pillar, or null. */
    readonly behavioral: ReadinessPillar | null
    /** True when both pillars passed. */
    readonly ready: boolean
}

/** The streak action the interview reports when a session is submitted. */
export interface InterviewStreakAction {
    /** The idempotency key: the session id. */
    readonly actionId: string
    /** The part of the app. */
    readonly partId: "interview"
    /** The action kind of the streak rules. */
    readonly kind: "interview-submitted"
    /** The session the action came from. */
    readonly sourceRef: string
    /** When it was stored. */
    readonly at: Date
}

/** The track a read narrows to, or null for every track. */
export type TrackFilter = string | null

/** The lessons each gap links to, by module slug. */
export type LessonsByModule = Readonly<Record<string, ReadonlyArray<LessonLink>>>

/** The lessons of one module slug, as a list entry. */
export interface ModuleLessons {
    /** The module slug. */
    readonly moduleRef: string
    /** Its live lessons. */
    readonly lessons: ReadonlyArray<LessonLink>
}
