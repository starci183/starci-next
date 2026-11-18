import type { LessonProgressView } from "@modules/domain/attempt"

/** The lesson whose progress is read. */
export interface GetLessonProgressRequest {
    /** The lesson id. */
    readonly lessonId: string
    /** The locale of the notes the progress completes from the lesson. */
    readonly locale: "vi" | "en"
}

/** The progress of a lesson with the article sections the learner marked as read. */
export interface LessonProgressWithReads extends LessonProgressView {
    /** The ids of the sections marked as read, oldest first. */
    readonly readSectionIds: ReadonlyArray<string>
}
