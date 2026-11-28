import type { NarratorView } from "../Narration"
import type { NarrationTerm } from "../Narration"

/** Where a case stands for the learner: locked until the case before it is green, open, red or green, or a run that stopped with an error. */
export type CourseCaseStatus = "locked" | "open" | "red" | "green" | "error"

/** One case as a row of the list. */
export type CourseCaseRowView = {
    readonly id: string
    readonly title: string
    readonly status: CourseCaseStatus
    /** The status in words. */
    readonly statusLabel: string
    /** The case whose detail stands under its row. */
    readonly isSelected: boolean
}

/** A command the learner types in their own terminal: what it does and the line itself. */
export type CourseCommandView = {
    readonly id: string
    readonly title: string
    readonly note: string
    readonly command: string
}

/** One level of the hint ladder: its words are present only when the level was opened. */
export type CourseHintLevelView = {
    readonly level: number
    readonly title: string
    /** The text of an opened level; empty while closed. */
    readonly text: string
    readonly isOpen: boolean
    /** True for the one level that may be opened now: the first closed one, when the case is open. */
    readonly isNext: boolean
    /** True while the level is being opened. */
    readonly isOpening: boolean
}

/** The reset to the reference step: its command and the line that says where the learner's file is kept. */
export type CourseResetView = {
    readonly command: CourseCommandView
    readonly warning: string
}

/** The case on screen: what it asks, how it stands and what the learner can do next. */
/** One thing a case checks, with where the last run left it and the words of that state. */
export type CourseInvariantView = {
    readonly text: string
    readonly state: "done" | "error" | "notRun"
    readonly stateLabel: string
}

/** One side of a case before or after its fix: the steps in order, what comes out, and what it costs or gains. Strings carry inline marks. */
export type CourseCaseSideView = {
    readonly steps: ReadonlyArray<string>
    readonly result: string
    /** What it costs (before the fix) or what it gains (after it). */
    readonly outcome: string
}

/**
 * An unhappy case before and after its fix (owner 2026-11-28: "trước và sau khi làm để học sinh thấm tư tưởng"). The "before" side is
 * open from the start; the fix, the "after" side and the idea come only once the case is revealed (green once, or the solution opened),
 * and are undefined until then.
 */
export type CourseCaseBeforeAfterView = {
    readonly before: CourseCaseSideView
    /** How the fix goes; empty when the record has none or the case is not revealed. */
    readonly fix: string
    /** The system after the fix; undefined until the case is revealed. */
    readonly after: CourseCaseSideView | undefined
    /** The one idea the case proves; empty until the case is revealed. */
    readonly idea: string
}

export type CourseCaseDetailView = {
    readonly id: string
    readonly status: CourseCaseStatus
    /** The line that says a locked case opens later; empty otherwise. */
    readonly lockedNote: string
    /** The interviewer's follow-up question the case answers; empty when the record has none. A quote: plain text. */
    readonly question: string
    /** Who asks it, as the source of the question's Quote: the mentor himself ("Thầy StarCi · CTO nivo.vn"). */
    readonly asker: string
    /** The mentor who asks (photo, "Thầy StarCi", "CTO nivo.vn"), repeated over each question the case opens with. */
    readonly narrator: NarratorView
    /** The situation the case creates, one line of narration (inline markdown, lessons.md §9); empty when the record has none. */
    readonly situation: string
    /** The narration's keywords and their notes, in the reader's language: the case is one section, each marked where it first stands. */
    readonly terms: ReadonlyArray<NarrationTerm>
    /** What must hold, each marked by the last run: held, broken, or not run yet (owner 2026-11-27: every check lit on its own). */
    readonly invariants: ReadonlyArray<CourseInvariantView>
    /** The chaos switched on while the case runs, in plain words; empty for a case with none. */
    readonly chaos: ReadonlyArray<string>
    /** The command that runs the case on the learner's machine. */
    readonly run: CourseCommandView | undefined
    /** The hint ladder: undefined for a happy case, which needs none. */
    readonly hints: ReadonlyArray<CourseHintLevelView> | undefined
    /** The command that shows the reference fix once the case was green. */
    readonly diff: CourseCommandView | undefined
    /** The way back to the reference step when the learner is stuck. */
    readonly reset: CourseResetView | undefined
    /** The case before and after its fix; undefined for a case without one (every happy case), and nothing extra is drawn then. */
    readonly beforeAfter: CourseCaseBeforeAfterView | undefined
}

/** What a loop page draws: the cases in order and the one selected. */
export type CourseCaseLoopView = {
    readonly cases: ReadonlyArray<CourseCaseRowView>
    /** The line under the cases: how many pass and what opens once all do. */
    readonly progress: string
    readonly selected: CourseCaseDetailView | undefined
    /** The line above the list that says what this loop is. */
    readonly intro: string
    /** The note under the list: the lab's AI tools; undefined on a loop that offers none. */
    readonly mcp: CourseCommandView | undefined
}

/** Copy of a command line. */
export type CourseCopyLabels = {
    readonly copy: string
    readonly copied: string
    readonly copyFailed: string
}

/** The words of a loop page. */
export type CourseCaseLoopLabels = {
    /** The loop's name with its count ("Unhappy path · 7 trên 7 ca đã qua"): the accordion's accessible name, never a drawn heading (it repeats the tab). */
    readonly listTitle: string
    /** The count alone ("7 trên 7 ca đã qua"), drawn as the caption meta line above the cases. */
    readonly countLine: string
    readonly empty: string
    /** The three parts of a case, each led by its round number (owner 2026-11-28): the situation, the conditions, the check. */
    readonly situationTitle: string
    readonly checkTitle: string
    /** The one quiet line that opens the way back to the reference step. */
    readonly stuckTitle: string
    readonly invariantsTitle: string
    readonly noInvariants: string
    readonly chaosTitle: string
    readonly noChaos: string
    readonly hintsTitle: string
    readonly openHint: (level: number) => string
    readonly copy: CourseCopyLabels
    /** The words of a case's before-and-after parts. */
    readonly beforeAfter: CourseBeforeAfterLabels
}

/** The words of a case's before-and-after parts (owner 2026-11-28). */
export type CourseBeforeAfterLabels = {
    /** The first part's title on a case that has the block ("Chuyện xảy ra"), in place of the plain situation title. */
    readonly storyTitle: string
    /** The part that tells what breaks while the code is not fixed ("Chưa sửa thì hỏng"). */
    readonly brokenTitle: string
    /** The part that tells how the fix goes ("Sửa thế nào"). */
    readonly fixTitle: string
    /** The line that stands in the fix part until the case is revealed. */
    readonly fixLocked: string
    readonly beforeTitle: string
    readonly afterTitle: string
    /** The words before a side's result ("Kết quả"). */
    readonly resultLabel: string
    /** The words before what the fix gains ("Được gì"). */
    readonly gainLabel: string
    /** The source of the idea's quote ("Ca này chứng minh"). */
    readonly ideaTitle: string
}
