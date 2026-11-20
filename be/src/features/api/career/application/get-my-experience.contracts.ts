import type { ExperienceState } from "@modules/domain/career"

/** What lists the experience items of the signed-in learner takes. */
export interface GetMyExperienceRequest {
    /** The state to list, or null for every item. */
    readonly state: ExperienceState | null
    /** The language of the item labels; vi when absent. */
    readonly locale?: "vi" | "en" | null
}
