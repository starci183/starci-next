"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { answeredData, failing, type ReviewQueueQuery } from "@/modules/api"
import { queryReviewQueue } from "@/modules/api/graphql/queries/query-review-queue"

/** Cache identity of the reviewQueue read; the viewer is part of the key. */
export const QUERY_REVIEW_QUEUE_SWR_KEY = "QUERY_REVIEW_QUEUE_SWR"

/** One tab of the review queue with the count of every tab. */
export type ReviewQueueView = ReviewQueueQuery["reviewQueue"]

/** Reads one tab of the review queue; idle unless the reader holds a signer role. */
export const useQueryReviewQueueSwr = (tab: string, isEnabled: boolean): SWRResponse<ReviewQueueView> => {
    const viewer = viewerKey(QUERY_REVIEW_QUEUE_SWR_KEY, useViewerId())
    return useSWR<ReviewQueueView>(
        viewer === null || !isEnabled ? null : [...viewer, tab],
        async () =>
            (
                await answeredData(
                    failing(() => queryReviewQueue({ request: { tab } })),
                    "reviewQueue",
                )
            ).reviewQueue,
    )
}
