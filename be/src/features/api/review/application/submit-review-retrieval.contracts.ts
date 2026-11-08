import type { ReviewLocale } from "@modules/domain/review"

/** The request of the submitReviewRetrieval door. */
export interface SubmitReviewRetrievalRequest {
    /** The itemId. */
    readonly itemId: string
    /** The revision. */
    readonly revision: number
    /** The text. */
    readonly text: string
    /** The locale. */
    readonly locale: ReviewLocale
}
