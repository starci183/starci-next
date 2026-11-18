import type { LessonRowView } from "./catalog"

/** One entry of the aside of a topic: a name and, when it leads somewhere, its destination. */
export type TopicAsideEntry = {
    readonly id: string
    readonly title: string
    /** The destination, or empty for text only. */
    readonly href: string
}

/** One of the four parts of a lesson as the aside lists it. */
export type TopicPartView = {
    readonly id: string
    readonly title: string
    /** True when the reader's plan does not include the part. */
    readonly isLocked: boolean
}

/** The topic screen as it is drawn: every word is already resolved. */
export type TopicScreenView = {
    readonly title: string
    readonly description: string
    /** The fact line under the description (lessons and minutes). */
    readonly facts: string
    /** The one primary: continue the lesson under way, or start; undefined when the topic has no open lesson. */
    readonly primary: { readonly label: string; readonly href: string } | undefined
    /** How many lessons are done, in words, and as a percent for the bar. */
    readonly progress: { readonly label: string; readonly percent: number }
    /** The notice a reader without Premium gets over the list; undefined with Premium. */
    readonly notice: { readonly title: string; readonly text: string } | undefined
    readonly rows: ReadonlyArray<LessonRowView>
    readonly parts: ReadonlyArray<TopicPartView>
    readonly prerequisites: ReadonlyArray<TopicAsideEntry>
    readonly related: ReadonlyArray<TopicAsideEntry>
}

/** The words of the topic screen that do not depend on its data. */
export type TopicLabels = {
    readonly pageTitle: string
    /** The accessible name of the trail from the catalog to the topic. */
    readonly breadcrumbs: string
    readonly list: string
    readonly empty: string
    readonly partsTitle: string
    readonly partsNote: string
    readonly prerequisites: string
    readonly related: string
    readonly moved: string
    readonly movedOpen: string
}

/** The words the topic view is built with, resolved by the block. */
export type TopicWords = {
    readonly facts: (lessons: number, minutes: number) => string
    readonly progress: (done: number, total: number) => string
    readonly startFirst: string
    readonly resumePart: (part: number) => string
    readonly resume: (title: string, part: number) => string
    readonly notice: { readonly title: string; readonly text: string }
    readonly parts: ReadonlyArray<{ readonly id: string; readonly title: string; readonly isFree: boolean }>
}
