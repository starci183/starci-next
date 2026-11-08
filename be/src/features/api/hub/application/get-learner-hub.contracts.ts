import type { HubLocale } from "@modules/domain/hub"

/** The request of the learnerHub door. */
export interface GetLearnerHubRequest {
    /** The locale of the labels and titles. */
    readonly locale: HubLocale
}
