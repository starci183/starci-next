import type { CourseCaseState } from "./lesson"

/** The words of a loop page that depend on the case or on the record. */
export type CourseLoopWords = {
    /** The state of a case in words. */
    readonly status: Readonly<Record<CourseCaseState, string>>
    /** The line a locked case shows: a normal case, the first question (it waits on the normal cases) and any later question. */
    readonly lockedNote: { readonly happy: string; readonly firstQuestion: string; readonly question: string }
    readonly runTitle: string
    readonly runNote: string
    readonly diffTitle: string
    readonly diffNote: string
    readonly resetTitle: string
    readonly resetNote: string
    /** The one-line warning that says where the learner's file is kept before the reset. */
    readonly resetWarning: (caseId: string) => string
    readonly hintTitle: (level: number) => string
    readonly mcpTitle: string
    readonly mcpNote: string
    /** What a loop is, one line above its cases. */
    readonly happyIntro: string
    readonly unhappyIntro: string
}

/** The words of the intro page that depend on the record. */
export type CourseIntroWords = {
    /** The node that stands for whoever calls the lab from outside. */
    readonly entry: string
    /** The frame the lab's parts stand in: where they run. */
    readonly frame: string
    /** The line under a case's outcome that names the case ("Case: <title>"). */
    readonly outcomeCase: (title: string) => string
}

/** The words of the naming page that depend on the record. */
export type CoursePatternWords = {
    /** The line that points back to the interview question, for a record that gives no recall of its own. */
    readonly lead: string
    readonly greenLabel: string
    readonly openLabel: string
}

/** How a production repository handles an idea, as the comparison words it. */
export type CourseProductionShowsWords = Readonly<
    Record<"yes" | "engine" | "partial" | "no" | "manual" | "unknown", string>
>

/** The words of the comparison with real repositories that depend on the record. */
export type CourseProductionWords = {
    /** The name of the learner's own row. */
    readonly learner: string
    /** The muted line under a repository: its language and, when known, the day its files were checked. */
    readonly repoMeta: (lang: string, checked: string | undefined) => string
    /** The name of the standard reference's row (`Bản tham chiếu chuẩn`). */
    readonly reference: string
    /** The muted line under the standard reference: its language, the day it was checked and the relay command that fetches it. */
    readonly referenceMeta: (lang: string, checked: string, command: string) => string
    readonly shows: CourseProductionShowsWords
}
