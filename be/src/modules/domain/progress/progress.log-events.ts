/** Events the progress read model records; fields are ids, never a body. */
export enum ProgressLogEvent {
    /** One source of the progress could not be read, so its section shows as unavailable. */
    SourceFailed = "progress.source_failed",
    /** One lesson could not be read, so it counts as not started. */
    LessonFailed = "progress.lesson_failed",
}
