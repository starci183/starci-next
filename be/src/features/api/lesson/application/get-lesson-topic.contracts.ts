import type { LessonLocale } from "@modules/domain/lesson"

/** The topic to read and the locale of its titles. */
export interface GetLessonTopicRequest {
    /** The topic slug. */
    readonly topic: string
    /** The locale of the titles. */
    readonly locale: LessonLocale
}
