/** The languages of the app a lab text is written in. */
export const COURSE_LOCALES = ["vi", "en"] as const

/** One locale of the app. */
export type CourseLocale = (typeof COURSE_LOCALES)[number]

/** What a case run ended as on the learner's machine. */
export type CourseRunStatus = "green" | "red" | "error"

/** The two kinds of case of a lab: a happy case that must pass, and an unhappy case the learner fixes until it is green. */
export type CourseCaseKind = "happy" | "unhappy"

/** What a case shows the learner: locked until the case before it was green, open, or the outcome of its newest run. */
export type CourseCaseStatus = "locked" | "open" | "red" | "green" | "error"

/** The `schema` of a lab record of the seed standard, when a record names it. */
export const COURSE_LAB_SCHEMA = "starci-next-seed-standard/essentials-lab@2"

/** The most hints a case has: levels 1 to 3. */
export const COURSE_HINT_LEVELS = 3

/** A text of the record: Vietnamese, and English when the record carries it. */
export interface CourseText {
    /** Vietnamese. */
    readonly vi: string
    /** English, or null when the record carries none (shown as missing, never invented). */
    readonly en: string | null
}

/** One chaos switch of a case as the web reads it. */
export interface CourseChaosView {
    /** The switch key. */
    readonly key: string
    /** The switch value, as text. */
    readonly value: string
}

/** One invariant statement in both languages. */
export interface CourseInvariantView {
    /** The invariant id. */
    readonly id: string
    /** Vietnamese. */
    readonly vi: string
    /** English. */
    readonly en: string
}

/** One hint level of a case for one learner: the text only once the level is open. */
export interface CourseHintView {
    /** The level, 1 to 3. */
    readonly level: number
    /** The hint text in the asked locale, or null while the level is closed. */
    readonly text: string | null
    /** Whether the learner opened this level. */
    readonly unlocked: boolean
}

/** One happy or unhappy case as the lesson door reads it. */
export interface CourseCaseSpecView {
    /** The case id. */
    readonly id: string
    /** The title in both languages. */
    readonly title: { readonly vi: string; readonly en: string }
    /** The chaos the case runs under. */
    readonly chaos: ReadonlyArray<CourseChaosView>
    /** The ids of the invariants the case must keep. */
    readonly invariants: ReadonlyArray<string>
    /** The term the case teaches, or null for a happy case. */
    readonly teaches: string | null
    /** The hint levels, closed or open for this learner; empty for a happy case. */
    readonly hints: ReadonlyArray<CourseHintView>
    /** Whether a reference step exists to reset to. */
    readonly hasReference: boolean
}

/** One service of the lab's declared stack. */
export interface CourseServiceView {
    /** The service id. */
    readonly id: string
    /** The port it listens on. */
    readonly port: number
    /** Its own database, or null. */
    readonly db: string | null
    /** The dependencies it uses. */
    readonly uses: ReadonlyArray<string>
    /** What it does. */
    readonly role: CourseText
}

/** One backing dependency of the lab's declared stack. */
export interface CourseDepView {
    /** The dependency id. */
    readonly id: string
    /** The image it runs. */
    readonly image: string
    /** What it is for. */
    readonly role: CourseText
}

/** The lab record as the web may see it: all of the record except the hint texts of closed levels, and no grader beyond its matrix dimensions. */
export interface CourseLessonView {
    /** The lesson id. */
    readonly lessonId: string
    /** The version label of the live record. */
    readonly version: string
    /** The lab repository id. */
    readonly lab: string
    /** The concept the lesson teaches. */
    readonly concept: string
    /** The concepts that come before it. */
    readonly requires: ReadonlyArray<string>
    /** The terms learner-facing words may name. */
    readonly allowedTerms: ReadonlyArray<{ readonly id: string; readonly term: string }>
    /** The declared stack. */
    readonly stack: {
        readonly language: string
        readonly runtime: string
        readonly test: string
        readonly services: ReadonlyArray<CourseServiceView>
        readonly deps: ReadonlyArray<CourseDepView>
    }
    /** The one file the learner edits. */
    readonly learnerFile: string
    /** Every invariant in both languages. */
    readonly invariants: ReadonlyArray<CourseInvariantView>
    /** The happy cases in order. */
    readonly happy: ReadonlyArray<CourseCaseSpecView>
    /** The unhappy cases in order. */
    readonly unhappy: ReadonlyArray<CourseCaseSpecView>
    /** The dimensions of the hidden grading matrix. */
    readonly grader: { readonly steps: ReadonlyArray<string>; readonly faults: ReadonlyArray<string> }
    /** The framework version's file map, for the NestJS source handed over on a pass. */
    readonly nestjs: ReadonlyArray<{ readonly from: string; readonly to: string }>
}

/** Why a run failed: the invariant that broke and what was expected against what happened. */
export interface CourseFailure {
    /** The invariant id, or null when the run did not name one. */
    readonly invariant: string | null
    /** The message the run printed. */
    readonly message: string
    /** What was expected, when the run says. */
    readonly expected: string | null
    /** What happened, when the run says. */
    readonly actual: string | null
}

/** The newest run of a case as the cases door reads it. */
export interface CourseLastRunView {
    /** When it ran on the machine, ISO 8601. */
    readonly ranAt: string
    /** How long it took, in milliseconds. */
    readonly durationMs: number
    /** The learner's commit it ran on, or null when git did not say (a learner may run before committing). */
    readonly learnerCommit: string | null
    /** Why it failed, or null when it is green. */
    readonly failed: CourseFailure | null
}

/** One case of the lab with where the learner stands on it. */
export interface CourseCaseStateView {
    /** The case id. */
    readonly caseId: string
    /** Happy or unhappy. */
    readonly kind: CourseCaseKind
    /** Locked, open, or the outcome of the newest run. */
    readonly status: CourseCaseStatus
    /** Whether the case was green at least once, even if a later run is red. */
    readonly everGreen: boolean
    /** How many hint levels the learner opened. */
    readonly hintsOpened: number
    /** Whether the diff against the reference is available: only once the case was green. */
    readonly diffAvailable: boolean
    /** Whether the learner may reset to the reference step: an unhappy case that has one. */
    readonly resetAvailable: boolean
    /** The newest run, or null when the case never ran. */
    readonly lastRun: CourseLastRunView | null
}

/** What the cases door answers: the case to work on now and every case in order. */
export interface CourseCasesView {
    /** The first open case that was never green, or null when every case was. */
    readonly currentCaseId: string | null
    /** Happy cases in order, then unhappy cases in order. */
    readonly cases: ReadonlyArray<CourseCaseStateView>
}

/** The hint a learner opened: its level and text. */
export interface CourseHintOpened {
    /** The case id. */
    readonly caseId: string
    /** The level, 1 to 3. */
    readonly level: number
    /** The hint text in the asked locale. */
    readonly text: string
}

/** What an upload did: stored, or already held (a resend). */
export interface CourseUploadReceipt {
    /** False when the event id was already held and nothing changed. */
    readonly recorded: boolean
}
