/** Events the lesson capability records; fields are counts, versions, hashes and issue locations, never an answer. */
export enum LessonLogEvent {
    /** One concept folder was imported, left as it was, refused or found invalid. */
    Imported = "lesson.imported",
}
