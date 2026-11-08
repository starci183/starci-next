/** The levels of an interview: the same three tiers the teacher's banks use. */
export const INTERVIEW_TIERS: ReadonlyArray<InterviewTier> = ["junior", "middle", "senior"]

/** The six fixed STAR dimensions of a behavioural answer. */
export const STAR_KEYS: ReadonlyArray<StarKey> = [
    "situationClarity",
    "actionSpecificity",
    "resultImpact",
    "selfAwareness",
    "communication",
    "relevanceToRole",
]

/** The four industry dimensions a technical checklist item belongs to. */
export const TECHNICAL_DIMENSIONS: ReadonlyArray<TechnicalDimension> = [
    "communication",
    "problemSolving",
    "technical",
    "testing",
]

/** The question kinds the text interview asks; the teacher's `design` and `coding` kinds need a canvas and an editor. */
export const SKIPPED_KINDS: ReadonlyArray<string> = ["design", "coding"]

/** The seniority of a question. */
export type InterviewTier = "junior" | "middle" | "senior"

/** The two families of questions; they are scored as separate pillars. */
export type InterviewFamily = "technical" | "behavioral"

/** The locales the banks are written in. */
export type InterviewLocale = "vi" | "en"

/** Whether a session was drawn from the free quota or under Premium. */
export type InterviewAccess = "free" | "premium"

/** A STAR dimension key. */
export type StarKey =
    "situationClarity" | "actionSpecificity" | "resultImpact" | "selfAwareness" | "communication" | "relevanceToRole"

/** A technical checklist dimension. */
export type TechnicalDimension = "communication" | "problemSolving" | "technical" | "testing"

/** Where a session stands. */
export type InterviewStatus = "active" | "submitted" | "grading" | "graded" | "failed" | "abandoned"

/** The verdict of a session, a pillar or a question. */
export type InterviewVerdict = "pass" | "borderline" | "fail"

/** Where a bank version stands. */
export type BankStatus = "validated" | "published" | "superseded"

/** Who speaks a turn. */
export type TurnRole = "interviewer" | "candidate"

/** What a turn is. */
export type TurnKind = "prompt" | "followUp" | "probe" | "hint" | "answer" | "skip" | "done"

/** One problem found while importing a bank, with the source file and field that hold it. */
export interface InterviewIssue {
    /** The file of the bank folder, posix and relative. */
    readonly path: string
    /** The field inside the file, or an empty text for the file itself. */
    readonly field: string
    /** What is wrong, in words for the author. */
    readonly message: string
}

/** One file read from a bank folder: its text and the hash of its raw bytes. */
export interface InterviewSourceFile {
    /** The posix path relative to the bank folder. */
    readonly path: string
    /** The decoded text. */
    readonly text: string
    /** The lowercase hex SHA-256 of the raw bytes. */
    readonly sha256: string
}

/** One bank folder found in a data checkout. */
export interface InterviewSourceBank {
    /** The stable id: `<course folder>/<bank folder>` or `eq/<bank folder>`. */
    readonly bankId: string
    /** The course folder of a technical bank, or null for a behavioural one. */
    readonly course: string | null
    /** The bank folder name. */
    readonly folder: string
}

/** One text per locale. */
export type Localized<T> = Readonly<Record<InterviewLocale, T>>

/** One weighted checklist item of a technical question; the score bands of a question sum to 100. */
export interface ChecklistItem {
    /** What a strong answer says. */
    readonly text: string
    /** The dimension it evidences. */
    readonly dimension: TechnicalDimension
    /** Whether missing it fails the question. */
    readonly critical: boolean
    /** The points it gives. */
    readonly scoreBand: number
}

/** One sample answer the teacher scored with two reference models. */
export interface ExampleResult {
    /** 1 is the strongest answer, 5 the weakest. */
    readonly level: number
    /** The sample answer. */
    readonly answer: string
    /** The score the first reference model gave, or null when it failed to score. */
    readonly sonnet: number | null
    /** The score the second reference model gave, or null when it failed to score. */
    readonly haiku: number | null
}

/** One STAR line of a behavioural rubric. */
export interface StarRubricLine {
    /** The dimension. */
    readonly key: StarKey
    /** What good looks like for this question. */
    readonly text: string
}

/** The public part of one question body: what the learner may read while the interview runs. */
export interface QuestionPrompt {
    /** The question. */
    readonly prompt: string
    /** The code to read, or null. */
    readonly givenCode: string | null
    /** The diagram to read, or null. */
    readonly diagram: string | null
}

/** The interviewer's authored material for one locale. */
export interface InterviewerMaterial {
    /** The follow-ups the interviewer may ask. */
    readonly followUps: ReadonlyArray<string>
    /** The hints, in the order they are given. */
    readonly hints: ReadonlyArray<string>
}

/** The grading material of one question in one locale; server-only. */
export interface GradingMaterial {
    /** The rubric lines of a technical question. */
    readonly rubric: ReadonlyArray<string>
    /** The weighted checklist of a technical question. */
    readonly checklist: ReadonlyArray<ChecklistItem>
    /** The keywords of a technical question. */
    readonly keywords: ReadonlyArray<string>
    /** The STAR lines of a behavioural question. */
    readonly star: ReadonlyArray<StarRubricLine>
    /** The ownership reminder of a behavioural question, or null. */
    readonly ownershipSignal: string | null
    /** The sample answers of a technical question. */
    readonly exampleResults: ReadonlyArray<ExampleResult>
}

/** The grading data of one question: per locale, plus the ideal answer per code language and locale. */
export interface QuestionGrading {
    /** The grading material per locale. */
    readonly locales: Localized<GradingMaterial>
    /** The teacher's ideal answer by code language, then locale; empty for a behavioural question. */
    readonly ideal: Readonly<Record<string, Localized<string>>>
}

/** A question read, parsed and validated, ready to store. */
export interface QuestionDraft {
    /** `<bankId>/<n>`. */
    readonly questionId: string
    /** The position in the bank. */
    readonly sortIndex: number
    /** Whether the teacher marked it Premium. */
    readonly isPremium: boolean
    /** The family. */
    readonly family: InterviewFamily
    /** The tier. */
    readonly tier: InterviewTier
    /** The kind. */
    readonly kind: string
    /** The topic tags. */
    readonly tags: ReadonlyArray<string>
    /** The competency of a behavioural question, or null. */
    readonly competency: string | null
    /** The leadership tier of a senior behavioural question, or null. */
    readonly leadershipTier: string | null
    /** The public prompts by code language, then locale. A behavioural question has the language `agnostic`. */
    readonly bodies: Readonly<Record<string, Localized<QuestionPrompt>>>
    /** The interviewer material per locale. */
    readonly interviewer: Localized<InterviewerMaterial>
    /** The grading data. */
    readonly grading: QuestionGrading
}

/** A bank read, parsed and validated, ready to store. */
export interface BankDraft {
    /** The stable id. */
    readonly bankId: string
    /** The course folder of a technical bank, or null. */
    readonly course: string | null
    /** The family. */
    readonly family: InterviewFamily
    /** The position of the bank. */
    readonly sortIndex: number
    /** The overall difficulty. */
    readonly difficulty: string
    /** The title per locale. */
    readonly titles: Localized<string>
    /** The description per locale. */
    readonly descriptions: Localized<string>
    /** The module slugs of a technical bank. */
    readonly moduleRefs: ReadonlyArray<string>
    /** The questions in order. */
    readonly questions: ReadonlyArray<QuestionDraft>
    /** How many questions of the source the text interview left out: the design and coding kinds, and prompts that still give the answer away. */
    readonly skipped: number
    /** The SHA-256 over the sorted path and hash lines of every source file. */
    readonly contentHash: string
}

/** The outcome of reading a bank folder: a draft, or the issues that block it. */
export interface BankDraftResult {
    /** The draft, when no issue blocks it. */
    readonly draft: BankDraft | null
    /** Every issue found, in file order. */
    readonly issues: ReadonlyArray<InterviewIssue>
}

/** What the import asks of one data checkout. */
export interface ImportInterviewParams {
    /** The data checkout root, holding `courses/` and `mock-interview-eq/`. */
    readonly directory: string
    /** The label of the source ref (a git sha); it becomes the version of every bank imported. */
    readonly ref: string
    /** The bank ids to import, separated by commas; an empty text imports every bank. */
    readonly only: string
    /**
     * A second root laid out like the checkout (`courses/` and `mock-interview-eq/`): its files replace or add to the files of the
     * same bank path, and a bank only it holds is imported too. Absent: the checkout alone.
     */
    readonly overlay?: string | undefined
}

/** What happened to one bank. */
export type InterviewImportStatus = "created" | "unchanged" | "refused" | "invalid"

/** The counts, version and hashes the import prints for one bank; it never holds an answer. */
export interface InterviewImportReport {
    /** The bank id. */
    readonly bankId: string
    /** The version: the source ref. */
    readonly version: string
    /** What happened. */
    readonly status: InterviewImportStatus
    /** The content hash of the source, or an empty text. */
    readonly contentHash: string
    /** The number of source files read. */
    readonly files: number
    /** The questions stored. */
    readonly questions: number
    /** The questions left out because the text interview cannot take their kind. */
    readonly skipped: number
    /** The problems that blocked the bank. */
    readonly issues: ReadonlyArray<InterviewIssue>
}

/** One question drawn into a session. */
export interface SessionQuestion {
    /** The position, from 0. */
    readonly position: number
    /** The question id. */
    readonly questionId: string
    /** The bank id. */
    readonly bankId: string
    /** The bank version the session is graded against. */
    readonly bankVersion: string
    /** The code language of the body in use. */
    readonly bodyLanguage: string
    /** The family. */
    readonly family: InterviewFamily
}

export type {
    AbandonView,
    AnswerView,
    AttributeScore,
    BankOption,
    ChecklistResult,
    DimensionResult,
    EvidenceItem,
    Gap,
    GradedBy,
    GradingView,
    HistoryItem,
    HistoryView,
    InterviewAccessView,
    InterviewOptionsView,
    InterviewSetup,
    InterviewStreakAction,
    LessonLink,
    LessonsByModule,
    TrackFilter,
    ModuleLessons,
    QuestionScore,
    QuestionView,
    ReadinessPillar,
    ReadinessView,
    Scorecard,
    SessionView,
    TrackOption,
    TrendView,
    TurnView,
} from "./interview-view.contracts"

export type {
    ChecklistHit,
    DimensionLevel,
    GradedQuestion,
    GraderReply,
    GraderRequest,
    GradingQuestion,
    InterviewerDecision,
    InterviewerRequest,
} from "./interview-coach.contracts"

export type { QuestionPublicRow, SessionRow, TurnRow } from "./persistence/interview.rows"
