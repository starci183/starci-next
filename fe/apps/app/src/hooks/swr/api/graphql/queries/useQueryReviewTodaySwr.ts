"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryReviewToday } from "@/modules/api/graphql/queries/query-review-today"
import type { ReviewTodayView } from "@/modules/types"

/** Cache identity of the review-today read; the viewer and the locale are part of the key. */
export const QUERY_REVIEW_TODAY_SWR_KEY = "QUERY_REVIEW_TODAY_SWR"

/** Reads the review queue of today. A session reads it frozen: it does not read again when the window regains focus. */
export const useQueryReviewTodaySwr = (locale: string, isFrozen = false): SWRResponse<ReviewTodayView> => {
    const viewer = viewerKey(QUERY_REVIEW_TODAY_SWR_KEY, useViewerId())
    return useSWR<ReviewTodayView>(
        viewer === null ? null : [...viewer, locale],
        async () => {
            const { data } = await failing(() =>
                queryReviewToday({ request: { locale: locale === "en" ? "en" : "vi" } }),
            )
            if (data === undefined) throw new Error("reviewToday answered no data")
            return data.reviewToday
        },
        { revalidateOnFocus: !isFrozen },
    )
}
