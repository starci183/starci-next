import type { LessonLocale } from "./lesson.contracts"

/** A topic as a lesson names it. */
export interface LessonTopicRef {
    /** The topic slug. */
    readonly id: string
    /** The title. */
    readonly title: string
}

/** A related topic as the topic page links it. */
export interface LessonRelatedTopicView {
    /** The topic slug. */
    readonly id: string
    /** The title; the slug while the topic is not stored. */
    readonly title: string
    /** True only when the topic has a published lesson, so the page may link it. */
    readonly listed: boolean
}

/** One row of a topic path: a lesson of the topic or a lesson still to come. */
export interface LessonTopicStepView {
    /** The position in the path, from 1. */
    readonly order: number
    /** The title. */
    readonly title: string
    /** The published lesson of this row, or null for a row that is still to come. */
    readonly lessonId: string | null
}

/** The topic page: the topic, its group and its path of lessons. */
export interface LessonTopicView {
    /** The topic slug. */
    readonly id: string
    /** The title. */
    readonly title: string
    /** The catalog group of the topic. */
    readonly group: string
    /** Where the topic comes from. */
    readonly from: string
    /** What the topic covers, or null. */
    readonly description: string | null
    /** What a learner should know first, or null. */
    readonly prerequisites: ReadonlyArray<string> | null
    /** The related topics, or null. */
    readonly related: ReadonlyArray<LessonRelatedTopicView> | null
    /** The path rows in the teacher's order. */
    readonly path: ReadonlyArray<LessonTopicStepView>
}

/** The topic to read and the locale of its titles. */
export interface LessonTopicParams {
    /** The topic slug. */
    readonly topic: string
    /** The locale of the titles. */
    readonly locale: LessonLocale
}
