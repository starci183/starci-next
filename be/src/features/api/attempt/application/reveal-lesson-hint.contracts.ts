/** The scenario hint a learner asks for. */
export interface RevealLessonHintRequest {
    /** The lesson id. */
    readonly lessonId: string
    /** The scenario id. */
    readonly scenarioId: string
    /** The locale of the hint. */
    readonly locale: "vi" | "en"
}

/** The hint the learner unlocked. */
export interface LessonHintRevealed {
    /** The scenario. */
    readonly scenarioId: string
    /** The hint text. */
    readonly hint: string
}
