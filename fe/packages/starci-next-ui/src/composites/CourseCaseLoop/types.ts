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

export type CourseCaseDetailView = {
    readonly id: string
    readonly status: CourseCaseStatus
    /** The line that says a locked case opens later; empty otherwise. */
    readonly lockedNote: string
    /** The interviewer's follow-up question the case answers; empty when the record has none. A quote: plain text. */
    readonly question: string
    /** Who asks it, as the label over the question ("Chị trưởng nhóm hỏi"). */
    readonly asker: string
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
    readonly listTitle: string
    readonly empty: string
    readonly invariantsTitle: string
    readonly noInvariants: string
    readonly chaosTitle: string
    readonly noChaos: string
    readonly hintsTitle: string
    readonly openHint: (level: number) => string
    readonly copy: CourseCopyLabels
}
