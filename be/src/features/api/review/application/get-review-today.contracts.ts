import type { ReviewLocale } from "@modules/domain/review"

/** The request of the reviewToday door. */
export interface GetReviewTodayRequest {
    /** The locale. */
    readonly locale: ReviewLocale
}
