import type { LessonLocale } from "@modules/domain/lesson"

/** The lesson to read and the locale of its text. */
export interface GetLessonRequest {
    /** The lesson id. */
    readonly id: string
    /** The locale of the text. */
    readonly locale: LessonLocale
}
