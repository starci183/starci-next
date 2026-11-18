/** One scenario run asked of the learner's online device. */
export interface RequestLessonRunRequest {
    /** The lesson id. */
    readonly lessonId: string
    /** The scenario id. */
    readonly scenarioId: string
    /** The guards to switch off for the run. */
    readonly guardsOff: ReadonlyArray<string>
}

/** What the device was sent. */
export interface LessonRunRequested {
    /** The name of the device the manifest went to. */
    readonly device: string
    /** The command the device shows and asks the learner to confirm. */
    readonly command: string
    /** The signed manifest id. */
    readonly manifestId: string
}
