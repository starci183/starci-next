import type { ReviewLocale } from "@modules/domain/review"

/** The request of one deck with its samples and progress. */
export interface GetReviewDeckRequest {
    /** The deck id. */
    readonly deckId: string
    /** The locale. */
    readonly locale: ReviewLocale
}
