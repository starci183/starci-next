"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { answeredData, failing, type ReviewItemQuery } from "@/modules/api"
import { queryReviewItem } from "@/modules/api/graphql/queries/query-review-item"

/** Cache identity of the reviewItem read; the viewer is part of the key. */
export const QUERY_REVIEW_ITEM_SWR_KEY = "QUERY_REVIEW_ITEM_SWR"

/** One item under review with its audit trail. */
export type ReviewItemView = ReviewItemQuery["reviewItem"]

/** Reads one item under review; idle unless the reader holds a signer role, and never retried after a refusal. */
export const useQueryReviewItemSwr = (itemId: string, isEnabled: boolean): SWRResponse<ReviewItemView> => {
    const viewer = viewerKey(QUERY_REVIEW_ITEM_SWR_KEY, useViewerId())
    const key = viewer === null || !isEnabled ? null : [...viewer, itemId]
    return useSWR<ReviewItemView>(
        key,
        async () => {
            const data = await answeredData(
                failing(() => queryReviewItem({ request: { itemId } })),
                "reviewItem",
            )
            return data.reviewItem
        },
        { shouldRetryOnError: false },
    )
}
