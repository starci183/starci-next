"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryReviewDecks } from "@/modules/api/graphql/queries/query-review-decks"
import type { ReviewDeckView } from "@/modules/types"

/** Cache identity of the review-decks read; the viewer and the locale are part of the key. */
export const QUERY_REVIEW_DECKS_SWR_KEY = "QUERY_REVIEW_DECKS_SWR"

/** Reads the flashcard decks with whether the reader added each. */
export const useQueryReviewDecksSwr = (locale: string): SWRResponse<ReadonlyArray<ReviewDeckView>> => {
    const viewer = viewerKey(QUERY_REVIEW_DECKS_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<ReviewDeckView>>(viewer === null ? null : [...viewer, locale], async () => {
        const { data } = await failing(() =>
            queryReviewDecks({ request: { locale: locale === "en" ? "en" : "vi", track: null } }),
        )
        if (data === undefined) throw new Error("reviewDecks answered no data")
        return data.reviewDecks
    })
}
