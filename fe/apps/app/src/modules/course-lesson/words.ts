import type { CourseCaseState } from "./lesson"

/** The words of a loop page that depend on the case or on the record. */
export type CourseLoopWords = {
    /** The state of a case in words. */
    readonly status: Readonly<Record<CourseCaseState, string>>
    /** The line a locked case shows. */
    readonly lockedNote: string
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
    /** The last outcome: answering the interview question of the page's opening. */
    readonly outcomeAnswer: string
    /** The line under it: where that happens. */
    readonly outcomeAnswerCase: string
}

/** The words of the naming page that depend on the record. */
export type CoursePatternWords = {
    /** The sentence that gives the learner's work its name, from how many fixes there were and the concept's term. */
    readonly named: (count: number, term: string) => string
    readonly greenLabel: string
    readonly openLabel: string
}

/** How a production repository handles an idea, as the comparison words it. */
export type CourseProductionShowsWords = Readonly<Record<"yes" | "engine" | "partial" | "no" | "manual", string>>

/** The words of the comparison with real repositories that depend on the record. */
export type CourseProductionWords = {
    /** The name of the learner's own row. */
    readonly learner: string
    readonly shows: CourseProductionShowsWords
}
