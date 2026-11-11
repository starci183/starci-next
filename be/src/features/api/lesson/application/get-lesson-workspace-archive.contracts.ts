/** The workspace of one language of a lesson to download. */
export interface GetLessonWorkspaceArchiveRequest {
    /** The lesson id. */
    readonly id: string
    /** The language id of the workspace. */
    readonly language: string
}
