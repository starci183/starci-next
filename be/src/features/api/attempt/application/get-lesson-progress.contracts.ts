/** The lesson whose progress is read. */
export interface GetLessonProgressRequest {
    /** The lesson id. */
    readonly lessonId: string
    /** The locale of the notes the progress completes from the lesson. */
    readonly locale: "vi" | "en"
}
