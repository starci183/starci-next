/** The lessons whose opener scores are read. */
export interface GetLessonOpenerScoresRequest {
    /** The lesson ids, in the order the answer keeps. */
    readonly lessonIds: ReadonlyArray<string>
}
