import type { ExperiencePart } from "@modules/domain/career"

/** What appoints, rescopes or ends a reviewer takes. */
export interface SetExperienceReviewerRequest {
    /** The reviewer's provider subject. */
    readonly reviewerId: string
    /** The parts the reviewer may sign. */
    readonly parts: ReadonlyArray<ExperiencePart>
    /** The most open items at once, or null for the default. */
    readonly capacity: number | null
    /** The learners the reviewer must not review. */
    readonly conflicts: ReadonlyArray<string>
    /** True ends the appointment. */
    readonly end: boolean
    /** The roles the verified session asserts. */
    readonly roles: ReadonlyArray<string>
}
