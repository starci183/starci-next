import type { ReviewLocale } from "@modules/domain/review"

/** The request of the flipReviewCard door. */
export interface FlipReviewCardRequest {
    /** The itemId. */
    readonly itemId: string
    /** The locale. */
    readonly locale: ReviewLocale
}
