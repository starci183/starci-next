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
    /** One chaos switch in plain words; a switch the catalog does not know is told as its key and value. */
    readonly chaos: (key: string, value: string) => string
}

/** The words of the intro page that depend on the record. */
export type CourseIntroWords = {
    /** The node that stands for whoever calls the lab from outside. */
    readonly entry: string
    readonly summary: (counts: {
        readonly services: number
        readonly happy: number
        readonly unhappy: number
    }) => string
    readonly service: (part: {
        readonly role: string
        readonly port: number
        readonly db: string
        readonly uses: string
    }) => string
    readonly dep: (part: { readonly role: string; readonly image: string }) => string
    readonly outcomeFile: (file: string) => string
    readonly outcomeCase: (title: string) => string
    readonly legendLearner: (file: string) => string
    readonly happyTerm: string
    readonly unhappyTerm: string
    readonly servicesTerm: string
}

/** The words of the naming page that depend on the record. */
export type CoursePatternWords = {
    readonly entry: string
    readonly greenLabel: string
    readonly openLabel: string
}
