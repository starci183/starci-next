"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type ReviewStatsQuery } from "@/modules/api"
import { queryReviewStats } from "@/modules/api/graphql/queries/query-review-stats"

/** Cache identity of the review-stats read; the viewer is part of the key. */
export const QUERY_REVIEW_STATS_SWR_KEY = "QUERY_REVIEW_STATS_SWR"

/** The review statistics as the hub reads them. */
export type ReviewStats = ReviewStatsQuery["reviewStats"]

/** Reads how often the learner reviews and the share remembered by the number of the review. */
export const useQueryReviewStatsSwr = (): SWRResponse<ReviewStats> => {
    const viewer = viewerKey(QUERY_REVIEW_STATS_SWR_KEY, useViewerId())
    return useSWR<ReviewStats>(viewer, async () => {
        const { data } = await failing(() => queryReviewStats({ request: { days: 90 } }))
        if (data === undefined) throw new Error("reviewStats answered no data")
        return data.reviewStats
    })
}
