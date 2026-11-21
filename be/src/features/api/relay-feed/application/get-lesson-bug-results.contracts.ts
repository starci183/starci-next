import type { LessonLocale } from "@modules/domain/lesson"

/** The lesson whose bug-pack results are read, and the language of their texts. */
export interface GetLessonBugResultsRequest {
    /** The lesson id. */
    readonly lessonId: string
    /** The locale of the texts. */
    readonly locale: LessonLocale
}

/** The bug-pack test whose next hint the learner opens. */
export interface OpenLessonBugHintRequest extends GetLessonBugResultsRequest {
    /** The test id. */
    readonly testId: string
}
