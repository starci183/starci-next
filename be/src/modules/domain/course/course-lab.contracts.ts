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

/** One chaos switch of the lab with the label the lab declares for it, in both languages. */
export interface CourseChaosLabelView {
    /** The switch key. */
    readonly id: string
    /** The label in both languages. */
    readonly label: { readonly vi: string; readonly en: string }
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
    /** The interviewer's follow-up question the case answers; null when the record has none. */
    readonly question: CourseText | null
    /** What the learner did, what the customer gains and the English name; null until the case was green once, or when the record has none. */
    readonly recap: CourseRecapView | null
    /** The situation the case creates, one line of narration (inline markdown); null when the record has none. */
    readonly situation: CourseText | null
    /** The file and lines the case checks, lit when the case is picked; null when the record names none. */
    readonly focus: CourseFocusView | null
}

/** The file and the lines one case checks. */
export interface CourseFocusView {
    /** The path of the learner file in the lab. */
    readonly file: string
    /** The 1-based lines. */
    readonly lines: ReadonlyArray<number>
}

/** One HTTP endpoint: its method and path. */
export interface CourseEndpointView {
    readonly method: string
    readonly path: string
}

/** One step of the business flow of an order, with the name of the icon that leads it. */
export interface CourseArchitectureStepView {
    readonly text: CourseText
    /** The icon name the record gives (`credit-card`); the page maps it to a glyph. */
    readonly icon: string
}

/** One HTTP request the learner file sends, numbered in the order it runs. */
export interface CourseArchitectureRequestView {
    readonly n: number
    /** The calling service id. */
    readonly from: string
    /** The called service id. */
    readonly to: string
    readonly method: string
    readonly path: string
    /** What the request does, in business words. */
    readonly does: CourseText
    /** The endpoint the callee already has to revert it, or null; the page does not draw it (owner 2026-11-27). */
    readonly undo: CourseEndpointView | null
}

/** The tables one service's own database holds. */
export interface CourseArchitectureTablesView {
    readonly serviceId: string
    readonly tables: ReadonlyArray<string>
}

/** One learner file as the Kiến trúc page shows it: its path, its role, its excerpt and the line that sends each request. */
export interface CourseArchitectureFileView {
    readonly path: string
    /** What the file does, for a lab of several files; null when the record gives no role. */
    readonly role: CourseText | null
    /** The excerpt's span and its code cut from the base rung (null code when the server holds no text for the file); null when none. */
    readonly excerpt: { readonly from: number; readonly to: number; readonly code: string | null } | null
    readonly marks: ReadonlyArray<{ readonly line: number; readonly request: number }>
}

/** The static Kiến trúc page of the lesson. */
export interface CourseArchitectureView {
    readonly flow: ReadonlyArray<CourseArchitectureStepView>
    readonly requests: ReadonlyArray<CourseArchitectureRequestView>
    /** One entry per service that lists its tables, in the stack's order. */
    readonly tables: ReadonlyArray<CourseArchitectureTablesView>
    readonly why: CourseText
    /** The learner files, one or up to three. */
    readonly files: ReadonlyArray<CourseArchitectureFileView>
}

/** What page 5 says of one case. */
export interface CourseRecapView {
    readonly did: CourseText
    readonly gain: CourseText
    /** The English name of the idea. */
    readonly en: string
}

/** How a production repository handles one unhappy case. */
export type CourseProductionShows = "yes" | "engine" | "partial" | "no" | "manual" | "unknown"

/** One file of a production repository, its link pinned to a commit. */
export interface CourseProductionFileView {
    /** The path in the repository. */
    readonly path: string
    /** The link, pinned to a full commit sha. */
    readonly url: string
}

/** One public repository the learner's file is compared with on the last page. */
export interface CourseProductionView {
    /** `owner/name`. */
    readonly repo: string
    /** The language. */
    readonly lang: string
    /** The day the files were checked, or null. */
    readonly checked: string | null
    /** The files read, pinned. */
    readonly files: ReadonlyArray<CourseProductionFileView>
    /** One entry per unhappy case id. */
    readonly shows: ReadonlyArray<{ readonly caseId: string; readonly value: CourseProductionShows }>
    /** How it does it and how that differs from the learner's file. */
    readonly note: CourseText
}

/** The standard reference repository of the lesson, one row beside the production repositories on the last page. */
export interface CourseReferenceView {
    /** `owner/name`. */
    readonly repo: string
    /** The full commit sha the link is pinned to. */
    readonly commit: string
    /** The language and framework of the folder linked (`TypeScript (NestJS)`). */
    readonly lang: string
    /** The language folder at the pinned commit. */
    readonly url: string
    /** The day the comparison was read at that commit. */
    readonly checked: string
    /** The relay command that puts the folder next to the learner's lab. */
    readonly command: string
    /** One entry per unhappy case id. */
    readonly shows: ReadonlyArray<{ readonly caseId: string; readonly value: CourseProductionShows }>
    /** How it does it and how that differs from the learner's file. */
    readonly note: CourseText
}

/** The interview scene the first page opens with. */
export interface CourseHookView {
    /** A title that names no concept of the lesson; null when the record has none. */
    readonly title: CourseText | null
    /** The moment of the interview, or null; the page does not draw it (owner 2026-11-28). */
    readonly when: CourseText | null
    /** Who asks the question ("Chị trưởng nhóm"), or null: the page then names a generic interviewer. */
    readonly asker: CourseText | null
    readonly scene: CourseText
    readonly question: CourseText
    readonly stuck: CourseText
    readonly promise: CourseText
}

/** One keyword of the narration and its one plain sentence (lessons.md §9): drawn with a dotted underline and a hover or tap note. */
export interface CourseTermView {
    /** The keyword as it stands in a sentence ("timeout", "primary key"). */
    readonly term: string
    /** Its one sentence. */
    readonly note: CourseText
}

/** One ticked line of the first page. */
export interface CourseOutcomeView {
    readonly can: CourseText
    /** The unhappy case id that teaches it; null for the last line. */
    readonly caseId: string | null
}

/** The opening of the naming page. */
export interface CourseRecallView {
    readonly title: CourseText
    readonly paragraphs: ReadonlyArray<CourseText>
}

/** The closing words of the submit page. */
export interface CourseClosingView {
    readonly beyond: CourseText
    readonly answer: CourseText
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
    /** The name of its logo on the drawing, or null. */
    readonly icon: string | null
}

/** One backing dependency of the lab's declared stack. */
export interface CourseDepView {
    /** The dependency id. */
    readonly id: string
    /** The image it runs. */
    readonly image: string
    /** The name of its logo on the drawing, or null. */
    readonly icon: string | null
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
    /**
     * The keywords of the narration with their notes; a keyword of the naming pages (`named`, the lesson's own concept) only once the
     * page names the concept (REF rule).
     */
    readonly terms: ReadonlyArray<CourseTermView>
    /** The declared stack. */
    readonly stack: {
        readonly language: string
        readonly runtime: string
        readonly test: string
        /** Where the lab runs (`docker`), or null. */
        readonly host: string | null
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
    /** The label of each chaos switch the lab declares; a switch the cases use that is not listed has no label yet. */
    readonly chaos: ReadonlyArray<CourseChaosLabelView>
    /** The dimensions of the hidden grading matrix. */
    readonly grader: { readonly steps: ReadonlyArray<string>; readonly faults: ReadonlyArray<string> }
    /** The framework version's file map, for the NestJS source handed over on a pass. */
    readonly nestjs: ReadonlyArray<{ readonly from: string; readonly to: string }>
    /** The interview hook of page 1; null when the record has none. */
    readonly hook: CourseHookView | null
    /** The ticked outcomes of page 1; empty when the record lists none. */
    readonly outcomes: ReadonlyArray<CourseOutcomeView>
    /** The opening of page 5; null until every unhappy case was green once, or when the record has none. */
    readonly recall: CourseRecallView | null
    /** The closing words of page 6; null until every unhappy case was green once, or when the record has none. */
    readonly closing: CourseClosingView | null
    /** The repositories page 6 compares with; empty when the record lists none. */
    readonly production: ReadonlyArray<CourseProductionView>
    /** The standard reference repository of the lesson; null before the named pages, or when none is pinned for it. */
    readonly reference: CourseReferenceView | null
    /** The static Kiến trúc page; null for a record cut before it. */
    readonly architecture: CourseArchitectureView | null
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
    /** Whether the diff against the reference is available: only once the case was green, for a case with a reference rung. */
    readonly diffAvailable: boolean
    /** Whether the learner may reset to the reference step: any case that has one (a happy case the starter breaks included). */
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
