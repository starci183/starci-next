import type { ReviewLocale } from "@modules/domain/review"

/** The request of the reviewDecks door. */
export interface ListReviewDecksRequest {
    /** The locale. */
    readonly locale: ReviewLocale
    /** The track. */
    readonly track?: string | null | undefined
}
