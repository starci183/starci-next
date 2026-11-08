import type { ReviewQueueTab } from "@modules/domain/career"

/** What lists the review queue of a teacher or an appointed reviewer takes. */
export interface GetReviewQueueRequest {
    /** The tab to list. */
    readonly tab: ReviewQueueTab
    /** The roles the verified session asserts. */
    readonly roles: ReadonlyArray<string>
}
