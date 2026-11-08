import type { LessonLocale } from "@modules/domain/lesson"

/** The locale of the titles and the optional topic to narrow the incident list to. */
export interface ListIncidentsRequest {
    /** The locale of the titles. */
    readonly locale: LessonLocale
    /** Only this topic. */
    readonly topic: string | null
}
