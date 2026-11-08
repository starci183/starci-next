import type { ReviewDecisionInput } from "@modules/domain/career"

/** What approves or returns a batch of pending items takes. */
export interface DecideExperienceRequest {
    /** The decisions, each applied on its own. */
    readonly decisions: ReadonlyArray<ReviewDecisionInput>
    /** The roles the verified session asserts. */
    readonly roles: ReadonlyArray<string>
}
