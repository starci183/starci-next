import type { LocalizedLine } from "@modules/domain/career"

/** What sends an item of the signed-in learner to pending review takes. */
export interface SubmitExperienceRequest {
    /** The item. */
    readonly itemId: string
    /** The line, the draft or a rewording that keeps every value. */
    readonly line: LocalizedLine
}
