/** The article section a learner marks as read. */
export interface MarkLessonSectionReadRequest {
    /** The lesson id. */
    readonly lessonId: string
    /** The section id. */
    readonly sectionId: string
}
