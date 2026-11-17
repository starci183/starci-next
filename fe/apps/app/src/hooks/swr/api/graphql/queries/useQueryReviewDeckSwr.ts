"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type ReviewDeckQuery } from "@/modules/api"
import { queryReviewDeck } from "@/modules/api/graphql/queries/query-review-deck"

/** Cache identity of the one-deck read; the viewer, the deck and the locale are part of the key. */
export const QUERY_REVIEW_DECK_SWR_KEY = "QUERY_REVIEW_DECK_SWR"

/** One deck with sample questions and the progress of the learner in it. */
export type ReviewDeckDetail = ReviewDeckQuery["reviewDeck"]

/** Reads one deck by its id. */
export const useQueryReviewDeckSwr = (deckId: string, locale: string): SWRResponse<ReviewDeckDetail> => {
    const viewer = viewerKey(QUERY_REVIEW_DECK_SWR_KEY, useViewerId())
    return useSWR<ReviewDeckDetail>(viewer === null ? null : [...viewer, deckId, locale], async () => {
        const { data } = await failing(() =>
            queryReviewDeck({ request: { deckId, locale: locale === "en" ? "en" : "vi" } }),
        )
        if (data === undefined) throw new Error("reviewDeck answered no data")
        return data.reviewDeck
    })
}
