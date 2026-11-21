import type { TopicView } from "./lesson"

/** The topics the catalog read, by id: the path of each names the order of its lessons. */
export type CatalogTopics = Readonly<Record<string, TopicView>>

/** The four parts of a lesson a learner moves through, in order: essence, source, scenarios, apply. */
export const LESSON_PART_COUNT = 4

/** Where the learner stands on one lesson: nothing done, some part under way or finished, every part finished. */
export type LessonState = "todo" | "doing" | "done"

/** One part of a lesson as the batch read states it: its state and how many of its items are done. */
export type LessonPartStandingView = {
    readonly part: string
    readonly state: "none" | "doing" | "done" | "locked"
    readonly done: number
    readonly total: number
}

/** The learner's progress in the four parts of one lesson, as the batch read gives it (one entry per lesson). */
export type LessonPartsView = {
    /** Each of the four parts with its state and counts, in tab order (essence, source, scenarios, apply). */
    readonly parts: ReadonlyArray<LessonPartStandingView>
    /** How many of the four parts are finished (the Meter's value). */
    readonly doneParts: number
    /** The first part that is not finished, 1 to 4; 0 when all four are finished. */
    readonly currentPart: number
    /** True while some part is under way (started, not finished). */
    readonly isUnderWay: boolean
    /** True once something was answered, run or pulled in any part. */
    readonly isStarted: boolean
    /** The five opener questions of part 1 answered right, or undefined while the opener is not taken. */
    readonly openerRight: number | undefined
    /** The opener questions answered of five. */
    readonly openerAnswered: number
}

/** What the status tabs filter by; "all" filters nothing. */
export type CatalogStatusFilter = "all" | LessonState

/** What the plan select filters by: every lesson, the lessons whose free part 1 is still to do, the lessons that go on in Premium parts. */
export type CatalogPlanFilter = "all" | "free" | "premium"

/** What the reader chose on the toolbar; an empty query and "all" mean no filter. */
export type CatalogFilters = {
    readonly status: CatalogStatusFilter
    readonly query: string
    readonly topic: string
    readonly plan: CatalogPlanFilter
}

/** The tone of the state badge of a lesson row. */
export type LessonBadgeTone = "success" | "warning" | "neutral"

/** One lesson as its row draws it: every word already resolved. */
export type LessonRowView = {
    readonly id: string
    readonly title: string
    /** The one-line problem the lesson solves. */
    readonly problem: string
    readonly href: string
    readonly minutes: string
    /** How many of the four parts are finished. */
    readonly doneParts: number
    /** The words of the Meter (for example "2 of 4 parts"). */
    readonly partsLabel: string
    readonly state: LessonState
    readonly badge: { readonly label: string; readonly tone: LessonBadgeTone }
    /** True for the lesson the learner is on (the one the primary opens): its row is tinted. */
    readonly isCurrent: boolean
    /** The opener score (for example "Opener 3/5") on the topic page; empty on the catalog. */
    readonly opener: string
}

/** One topic of the catalog: its head, its bar and the lessons that pass the filters. */
export type CatalogGroupView = {
    readonly id: string
    readonly title: string
    /** For example "2/6 lessons done". */
    readonly progressLabel: string
    readonly done: number
    readonly total: number
    readonly href: string
    /** What the topic is about, one line. */
    readonly description: string
    /** Lessons and time, for example "6 lessons · 2 h 15 min". */
    readonly metaLabel: string
    /** Where the learner stands on the topic: not started, under way or done. */
    readonly badge: { readonly label: string; readonly tone: LessonBadgeTone }
    /** The lessons shown (the first three), in the topic's order. */
    readonly lessons: ReadonlyArray<LessonRowView>
    /** The link under the list when more lessons stand in the topic (for example "See all 6 lessons"); empty when none. */
    readonly moreLabel: string
}

/** One option of a select. */
export type CatalogOption = { readonly id: string; readonly label: string }

/** The lesson under way as the cover card draws it. */
export type CatalogResumeView = {
    readonly lessonId: string
    /** For example "API reliability · lesson 3/6". */
    readonly kicker: string
    readonly title: string
    /** How many of the lesson parts are finished. */
    readonly doneParts: number
    /** For example "Part 3 · 2 of 4 done". */
    readonly progressLabel: string
    readonly cta: string
    readonly href: string
}

/** The catalog as the screen draws it. */
export type CatalogView = {
    /** The four key figures of the band: lessons done, under way, not started and the time of the rest. */
    readonly figures: ReadonlyArray<{
        readonly id: string
        readonly term: string
        readonly value: string
        readonly unit?: string
    }>
    /** The lesson to go on with, drawn as the cover card; undefined when none is under way. */
    readonly resume: CatalogResumeView | undefined
    /** The fact line under the title (topics, lessons, lessons done). */
    readonly facts: string
    /** The one primary: continue, start or upgrade; undefined when the catalog holds no lesson. */
    readonly primary: { readonly label: string; readonly href: string } | undefined
    /** The count of each status tab; the three states add up to "all". */
    readonly counts: Readonly<Record<CatalogStatusFilter, number>>
    readonly topics: ReadonlyArray<CatalogOption>
    readonly groups: ReadonlyArray<CatalogGroupView>
}

/** The words of the catalog screen that do not depend on its data. */
export type CatalogLabels = {
    readonly figuresLabel: string
    readonly resumeTitle: string
    readonly topicsTitle: string
    /** The accessible name of the ring of a topic (for example "2 of 6 lessons done"). */
    readonly topicRing: (done: number, total: number) => string
    readonly fivePartsTitle: string
    readonly fiveParts: ReadonlyArray<{ readonly id: string; readonly title: string }>
    readonly title: string
    readonly breadcrumbs: string
    readonly statusLabel: string
    readonly statuses: ReadonlyArray<CatalogOption>
    readonly search: string
    readonly searchPlaceholder: string
    readonly clearSearch: string
    readonly topicSelect: string
    readonly allTopics: string
    readonly planSelect: string
    readonly plans: ReadonlyArray<CatalogOption>
    readonly viewTopic: string
    readonly noResult: { readonly title: (query: string) => string; readonly text: string; readonly clear: string }
    readonly empty: string
}

/** The words the catalog view is built with, resolved by the block. */
export type CatalogWords = {
    readonly figure: { readonly done: string; readonly doing: string; readonly todo: string; readonly time: string }
    readonly hours: (hours: number, minutes: number) => string
    readonly groupMeta: (lessons: number, minutes: number) => string
    readonly groupState: { readonly todo: string; readonly doing: string; readonly done: string }
    readonly resumeKicker: (topic: string, position: number, total: number) => string
    readonly resumeProgress: (part: number, done: number) => string
    readonly isPremium: boolean
    readonly minutes: (minutes: number) => string
    readonly partsLabel: (done: number) => string
    readonly facts: (topics: number, lessons: number, done: number) => string
    readonly factsFirst: (topics: number, lessons: number) => string
    readonly groupProgress: (done: number, total: number) => string
    readonly viewAll: (count: number) => string
    readonly state: {
        readonly todo: string
        readonly done: string
        readonly free: string
        readonly partDone: (part: number) => string
        readonly doing: (part: number) => string
    }
    readonly resume: () => string
    readonly start: () => string
    readonly upgrade: string
    /** The opener score of a lesson (for example "Opener 3/5"), or the line of a lesson whose opener is not taken. */
    readonly opener: (right: number | undefined, total: number) => string
}
