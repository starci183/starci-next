import type { LessonLocale } from "./lesson.contracts"

/** One source course module a topic is read from: the V1 course folder and the module position inside it. */
export interface LessonTopicModule {
    /** The course folder under courses/ (`1-system-design-mastery`). */
    readonly course: string
    /** The module position; the module folder is the one whose name starts with `<index>-`. */
    readonly index: number
}

/** The copy of a topic page the teacher has not rewritten yet. */
export interface LessonTopicDetails {
    /** What the topic covers. */
    readonly description: string
    /** What a learner should know first. */
    readonly prerequisites: ReadonlyArray<string>
    /** The slugs of related topics. */
    readonly related: ReadonlyArray<string>
}

/** One topic as the import knows it. */
export interface LessonTopicSource {
    /** The title. */
    readonly title: string
    /** Where the topic comes from, in words. */
    readonly from: string
    /** The source modules whose contents form the topic path. */
    readonly modules: ReadonlyArray<LessonTopicModule>
    /** The page copy, absent for a topic without any. */
    readonly details?: LessonTopicDetails
}

/** One row of a topic path as stored: a V1 content folder in the teacher's order. */
export interface LessonTopicStep {
    /** The position in the path, from 1. */
    readonly order: number
    /** The V1 content folder (`courses/<course>/modules/<module>/contents/<content>`). */
    readonly key: string
    /** The title of the content folder in each locale. */
    readonly titles: Readonly<Record<LessonLocale, string>>
}

/** What the import stores for a topic. */
export interface LessonTopicRecord {
    /** The topic slug. */
    readonly topic: string
    /** The title. */
    readonly title: string
    /** Where the topic comes from. */
    readonly from: string
    /** The page copy, or null. */
    readonly details: LessonTopicDetails | null
    /** The path rows in the teacher's order. */
    readonly path: ReadonlyArray<LessonTopicStep>
}

/** The topic level of the catalog: which topic each lesson belongs to and what each topic is. */
export interface LessonTopicCatalog {
    /** The topic slug of each lesson id. */
    readonly byLesson: Readonly<Record<string, string>>
    /**
     * The V1 content folder (`courses/<course>/modules/<module>/contents/<content>`) each lesson replaces in its topic path.
     * A lesson without an entry falls back to the folder its legacy reference names.
     */
    readonly sources: Readonly<Record<string, string>>
    /** Every topic by slug. */
    readonly topics: Readonly<Record<string, LessonTopicSource>>
}

/** The result of placing a lesson under a topic: the topic, or the reason it has none. */
export interface LessonTopicResolution {
    /** The topic slug, or null when the lesson cannot be placed. */
    readonly topic: string | null
    /** The topic the slug names, or null when the lesson cannot be placed. */
    readonly source: LessonTopicSource | null
    /** Why the lesson cannot be placed, or null. */
    readonly issue: string | null
}
