"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateRemoveReviewDeck } from "@/modules/api/graphql/mutations/mutation-remove-review-deck"

/** What the write answers. */
export type RemoveReviewDeckResult = { readonly deckId: string; readonly added: boolean; readonly suspended: number }

/** Cache identity of the RemoveReviewDeck write. */
export const MUTATE_REMOVE_REVIEW_DECK_SWR_KEY = "MUTATE_REMOVE_REVIEW_DECK_SWR"

/** The input of one RemoveReviewDeck write. */
export interface RemoveReviewDeckArgument {
    readonly deckId: string
}

/** The extra argument SWR hands the fetcher. */
interface RemoveReviewDeckExtra {
    readonly arg: RemoveReviewDeckArgument
}

/** Removes a deck from the reader's review. */
export const useMutateRemoveReviewDeckSwr = (): SWRMutationResponse<
    RemoveReviewDeckResult,
    unknown,
    string,
    RemoveReviewDeckArgument
> =>
    useSWRMutation<RemoveReviewDeckResult, unknown, string, RemoveReviewDeckArgument>(
        MUTATE_REMOVE_REVIEW_DECK_SWR_KEY,
        async (_key: string, { arg }: RemoveReviewDeckExtra) => {
            const { data } = await failing(() => mutateRemoveReviewDeck({ request: arg }))
            if (data === undefined) throw new Error("removeReviewDeck answered no data")
            return data.removeReviewDeck
        },
    )
