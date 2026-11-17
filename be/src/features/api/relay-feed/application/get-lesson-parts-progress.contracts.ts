/** The lessons whose four-part progress is read. */
export interface GetLessonPartsProgressRequest {
    /** The lesson ids, in the order the answer keeps. */
    readonly lessonIds: ReadonlyArray<string>
}
