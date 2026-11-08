import type { ReviewLocale } from "@modules/domain/review"

/** The request of the checkReviewCloze door. */
export interface CheckReviewClozeRequest {
    /** The itemId. */
    readonly itemId: string
    /** The n. */
    readonly n: number
    /** The choice. */
    readonly choice: string
    /** The locale. */
    readonly locale: ReviewLocale
}
