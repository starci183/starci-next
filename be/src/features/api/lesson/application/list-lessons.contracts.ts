import type { LessonDifficulty, LessonLocale } from "@modules/domain/lesson"

/** The catalog filters a learner may set, and the locale of the titles; a filter left out is null. */
export interface ListLessonsRequest {
    /** The locale of the titles and descriptions. */
    readonly locale: LessonLocale
    /** Only this group. */
    readonly group: string | null
    /** Only this topic. */
    readonly topic: string | null
    /** Only this category. */
    readonly category: string | null
    /** Only this difficulty. */
    readonly difficulty: LessonDifficulty | null
    /** Only lessons in this implementation language. */
    readonly language: string | null
    /** Only lessons for this cloud provider. */
    readonly provider: string | null
    /** Only lessons whose title or description contains this text. */
    readonly q: string | null
}
