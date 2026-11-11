import type { TopicAsideEntry, TopicPathRow } from "@starci-next/ui"
import type { LessonStatus } from "./catalog"

/** The topic screen as it is drawn: every word is already resolved. */
export type TopicScreenView = {
    readonly title: string
    /** The group of the topic in words, for the trail. */
    readonly group: string
    /** The id of the group, which picks the topic picture. */
    readonly groupId: string
    readonly description: string
    /** The facts under the title (lessons open of total, the source). */
    readonly facts: ReadonlyArray<string>
    /** The decorative 3D cover of the chapter: its path under public/. */
    readonly cover: string
    /** The one command of the hero: the next lesson to start or continue; undefined when no lesson is open. */
    readonly next: { readonly label: string; readonly href: string } | undefined
    /** The muted line of the hero (the source of the chapter). */
    readonly note: string
    /** The learner progress in the topic; empty for a reader without Premium. */
    readonly progress: string
    readonly rows: ReadonlyArray<TopicPathRow>
    readonly prerequisites: ReadonlyArray<TopicAsideEntry>
    readonly related: ReadonlyArray<TopicAsideEntry>
}

/** The words of the topic screen. */
export type TopicLabels = {
    readonly pageTitle: string
    /** The accessible name of the trail from the catalog to the topic. */
    readonly breadcrumbs: string
    readonly path: string
    /** The accessible name of the six phase rings and the word of a finished phase. */
    readonly ringsLabel: string
    readonly doneLabel: string
    readonly pathEmpty: string
    readonly asideEmpty: string
    readonly prerequisites: string
    readonly related: string
    readonly moved: string
    readonly movedOpen: string
    readonly upsell: { readonly label: string; readonly note: string } | undefined
}

/** The words the topic view is built with, resolved by the block. */
export type TopicWords = {
    readonly soon: string
    readonly pending: string
    readonly statuses: Readonly<Record<LessonStatus, string>>
    /** The button that opens a published lesson, by where the learner stands on it: start, continue or view. */
    readonly ctas: Readonly<Record<LessonStatus, string>>
    readonly openFacts: (open: number, total: number) => string
    readonly source: (from: string) => string
    readonly progress: (done: number, total: number) => string
    readonly meta: (difficulty: string, minutes: number, languages: string) => string
    /** The facts of the band: lessons, minutes and languages of the chapter. */
    readonly facts: (lessons: number, minutes: number, languages: number) => string
    /** The phase count of a lesson row ("3/6 pha"). */
    readonly phasesNote: (done: number, total: number) => string
    /** The title of each phase, by phase id. */
    readonly phases: Readonly<Record<string, string>>
    /** The spoken name of each implementation language, by language id. */
    readonly languageNames: Readonly<Record<string, string>>
    /** The short names used when a lesson lists several languages. */
    readonly shortLanguageNames: Readonly<Record<string, string>>
    readonly difficulty: Readonly<Record<string, string>>
    readonly isPremium: boolean
    /** The names of the groups of the approved tree, by group id. */
    readonly groups: Readonly<Record<string, string>>
}
