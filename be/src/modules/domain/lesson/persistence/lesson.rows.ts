import type { LessonContent, LessonDifficulty } from "../lesson.contracts"
import type { LessonTopicStep } from "../lesson-topic.contracts"

/** What the catalog reads of a live version: the listing columns and the title in the asked locale, never the content. */
export interface CatalogRow {
    /** The lesson id. */
    lesson_id: string
    /** The live version. */
    version: string
    /** The category. */
    category: string
    /** The catalog group. */
    lesson_group: string
    /** The topic slug. */
    topic: string
    /** The topic title, or the slug when the topic was never stored. */
    topic_title: string
    /** The difficulty. */
    difficulty: LessonDifficulty
    /** The minutes a learner needs. */
    minutes_read: number
    /** The implementation language, or `agnostic`. */
    implementation: string
    /** The title in the asked locale. */
    title: string
    /** The description in the asked locale. */
    description: string
}

/** What a read of one version needs: the listing columns and the whole parsed content, from which the public view is cut. */
export interface VersionRow {
    /** The lesson id. */
    lesson_id: string
    /** The version. */
    version: string
    /** The category. */
    category: string
    /** The catalog group. */
    lesson_group: string
    /** The topic slug. */
    topic: string
    /** The topic title, or the slug when the topic was never stored. */
    topic_title: string
    /** The difficulty. */
    difficulty: LessonDifficulty
    /** The minutes a learner needs. */
    minutes_read: number
    /** The implementation language, or `agnostic`. */
    implementation: string
    /** The parsed content. */
    content: LessonContent
}

/** The hash a stored version carries, which an import compares with the hash of the source before it decides anything. */
export interface HashRow {
    /** The content hash. */
    content_hash: string
    /** The V1 content folder the version replaces in its topic path, or null. */
    source_key: string | null
}

/** A related topic read for the topic page: its title and whether it has a published lesson. */
export interface RelatedTopicRow {
    /** The topic slug. */
    topic: string
    /** The title. */
    title: string
    /** True when the topic has a published lesson. */
    listed: boolean
}

/** The key a successful insert answers; no row means the version already exists. */
export interface InsertedRow {
    /** The lesson id. */
    lesson_id: string
}

/** A stored topic with its path. */
export interface TopicRow {
    /** The topic slug. */
    topic: string
    /** The title. */
    title: string
    /** Where the topic comes from. */
    source_note: string
    /** The description, or null. */
    description: string | null
    /** The prerequisites, or null. */
    prerequisites: Array<string> | null
    /** The related topic slugs, or null. */
    related: Array<string> | null
    /** The path rows. */
    path: Array<LessonTopicStep>
}

/** A live lesson of a topic, titled in the asked locale. */
export interface TopicLessonRow {
    /** The lesson id. */
    lesson_id: string
    /** The catalog group. */
    lesson_group: string
    /** The V1 content folder the lesson was converted from, or null. */
    source_key: string | null
    /** The title in the asked locale. */
    title: string
}

/** A live lesson that came from a V1 course module. */
export interface ModuleLessonRow {
    /** The module slug the lesson was converted from. */
    module_ref: string
    /** The lesson id. */
    lesson_id: string
    /** The topic the lesson sits under; the lesson route is `/essentials/{topic}/{lesson}`. */
    topic: string
    /** The title in the asked locale. */
    title: string
}
