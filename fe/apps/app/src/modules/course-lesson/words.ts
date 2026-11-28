import type { CourseCaseState, CourseLoopKind } from "./lesson"
import type { CourseNarrationWords } from "./narration"

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
    /** What a loop is, one line above its cases. */
    readonly happyIntro: string
    readonly unhappyIntro: string
    /** The line under a loop's cases: how many pass and the page that opens once all do. */
    readonly progress: (kind: CourseLoopKind, green: number, total: number) => string
    /** Who narrates and who asks (lessons.md §9). */
    readonly narration: CourseNarrationWords
}

/** The words of the intro page that depend on the record. */
export type CourseIntroWords = {
    /** The node that stands for whoever calls the lab from outside. */
    readonly entry: string
    /** The frame the lab's parts stand in: where they run. */
    readonly frame: string
    /** The card of a service's own database in the drawing. */
    readonly ownDb: (service: string) => string
    /** The line under a case's outcome that names the case ("Case: <title>"). */
    readonly outcomeCase: (title: string) => string
    /** What the explainer picture says, for assistive technology, from the lesson title. */
    readonly explainerAlt: (title: string) => string
    /** The lab card beside the intro: its title, the passed figure, the shape line, the cases not listed, the command and what it leads to. */
    readonly labTitle: string
    readonly labFigure: (green: number, total: number) => string
    readonly labMeta: (counts: { readonly services: number; readonly happy: number; readonly unhappy: number }) => string
    readonly labMore: (count: number) => string
    readonly labStart: string
    readonly labCaption: (total: number) => string
    /** Who narrates and who asks (lessons.md §9). */
    readonly narration: CourseNarrationWords
}

/** The words of the recap page (page 6) that depend on the record. */
export type CoursePatternWords = {
    /** The line that points back to the interview question, for a record that gives no recall of its own. */
    readonly lead: string
    readonly greenLabel: string
    readonly openLabel: string
    /** The progress card in the rail: its title, the command to the submission and what finishing means under it. */
    readonly labTitle: string
    readonly labStart: string
    readonly labCaption: (total: number) => string
    /** Who narrates and who asks (lessons.md §9). */
    readonly narration: CourseNarrationWords
}

/** The words of the gift repos that depend on the record. */
export type CourseProductionWords = {
    /** The muted line under a repository: its language and, when known, the day its files were checked. */
    readonly repoMeta: (lang: string, checked: string | undefined) => string
    /** The muted line under the StarCi standard's name: the day it was checked. */
    readonly referenceMeta: (checked: string) => string
}

/** The words of the Kiến trúc page that depend on the record (lessons.md §7, §8: Vietnamese sentences, English engineering terms). */
export type CourseArchitectureWords = {
    /** The node of the outside caller and the frame of the drawing, as on the intro. */
    readonly entry: string
    readonly frame: string
    /** The card of a service's own database in the drawing. */
    readonly ownDb: (service: string) => string
    /** `Một order đi qua 4 service`. */
    readonly flowTitle: (services: number) => string
    /** `Code chạy khi frontend gửi POST /checkout`, from the request the learner file serves. */
    readonly codeTitle: (method: string, path: string) => string
    /** The title when the record names no outside request. */
    readonly codeTitlePlain: string
    /** The opening line of a single-file lab, with the path and the service between backticks (set as inline code). */
    readonly codeLeadOne: (params: { readonly path: string; readonly service: string; readonly requests: number }) => string
    /** The opening line of a lab of several files: `Bạn sửa 2 file trong \`orders\`:`. */
    readonly codeLeadMany: (params: { readonly count: number; readonly services: string }) => string
    /** The line under an excerpt pairing a marked line with its request: `dòng 26 → request 1`. */
    readonly mark: (line: number, request: number) => string
    /** The line of a case that turns no chaos switch on. */
    readonly noChaos: string
    /** The words of the page's rail: the system's card (owner 2026-11-28: the rail names the architecture, never the lab again). */
    readonly rail: {
        readonly title: string
        readonly kindLabel: string
        readonly kindMicro: string
        readonly kindSingle: string
        readonly talkLabel: string
        readonly talkHttp: string
        readonly languageLabel: string
        readonly hostLabel: string
        readonly hostDocker: string
        readonly servicesTitle: string
        readonly depsTitle: string
        /** `:4001 · Express · database orders`. */
        readonly serviceLine: (params: { readonly port: number; readonly tech: string; readonly db: string }) => string
        /** ` · dùng Redis`, appended when the service uses a dependency. */
        readonly uses: (names: string) => string
        /** `Chạy 2 ca happy path với code này`. */
        readonly caption: (happy: number) => string
    }
}

/**
 * The words the dev-only Audit tab's builders map the record's codes onto (owner 2026-11-28): the verdicts, the finding kinds and statuses,
 * the impacts, the case kinds, the two cautions of a case and the rail's names. The page names come from the tabs' own labels.
 */
export type CourseAuditWords = {
    readonly verdict: { readonly de: string; readonly vap: string; readonly matDau: string }
    readonly kind: { readonly lint: string; readonly edit: string }
    readonly status: { readonly open: string; readonly fixed: string; readonly deferred: string }
    readonly impact: { readonly high: string; readonly medium: string; readonly low: string }
    readonly caseKind: { readonly happy: string; readonly unhappy: string }
    /** The paths table's words: the kind of a case in one word (`Happy`) and its impact in one word (`cao`). */
    readonly pathKind: { readonly happy: string; readonly unhappy: string }
    readonly pathImpact: { readonly high: string; readonly medium: string; readonly low: string }
    /** The caution of a rote fix; its text is the record's `mechanicalWhy`, else this line. */
    readonly mechanicalTitle: string
    readonly mechanicalText: string
    /** The caution of an assumption the audit did not check; its text is the record's `guess`. */
    readonly guessTitle: string
    readonly rail: {
        readonly title: string
        readonly findingsOpen: string
        readonly findingsFixed: string
        readonly lint: string
        readonly edit: string
        readonly casesHigh: string
        readonly casesMedium: string
        readonly casesLow: string
        readonly mechanical: string
        readonly checked: string
        readonly readerTitle: string
        readonly prerequisitesTitle: string
    }
}
