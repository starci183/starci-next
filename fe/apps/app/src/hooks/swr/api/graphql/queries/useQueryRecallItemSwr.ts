"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryRecallItem } from "@/modules/api/graphql/queries/query-recall-item"
import type { RecallItemView } from "@/modules/types"

/** Cache identity of the review-item read; the viewer, the item and the step of the session are part of the key. */
export const QUERY_RECALL_ITEM_SWR_KEY = "QUERY_RECALL_ITEM_SWR"

/**
 * Reads the front of one review item. `step` is the position in the session: an item that returns after a Forgot grade is read again, so the
 * new revision is never taken from the cache.
 */
export const useQueryRecallItemSwr = (
    locale: string,
    itemId: string | undefined,
    step: number,
): SWRResponse<RecallItemView> => {
    const viewer = viewerKey(QUERY_RECALL_ITEM_SWR_KEY, useViewerId())
    return useSWR<RecallItemView>(
        viewer === null || itemId === undefined ? null : [...viewer, locale, itemId, step],
        async () => {
            const request = { itemId: itemId ?? "", locale: locale === "en" ? "en" : "vi" }
            const { data } = await failing(() => queryRecallItem({ request }))
            if (data === undefined) throw new Error("recallItem answered no data")
            return data.recallItem
        },
        { revalidateOnFocus: false, dedupingInterval: 0 },
    )
}
