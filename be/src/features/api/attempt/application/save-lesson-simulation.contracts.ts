import type { LessonLocale } from "@modules/domain/lesson"

/** Where a learner stands in a simulation, to keep. */
export interface SaveLessonSimulationRequest {
    /** The lesson. */
    readonly lessonId: string
    /** The version the learner plays. */
    readonly version: string
    /** The simulation activity. */
    readonly activityId: string
    /** The locale of the stored content to validate against. */
    readonly locale: LessonLocale
    /** The state the learner is in now. */
    readonly currentStateId: string
    /** The actions of the current path, from the initial state. */
    readonly actionIds: ReadonlyArray<string>
}
