import type { ReviewLocale } from "@modules/domain/review"

/** The request of the reviewItem door. */
export interface GetReviewItemRequest {
    /** The itemId. */
    readonly itemId: string
    /** The locale. */
    readonly locale: ReviewLocale
}
