"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateAddReviewDeck } from "@/modules/api/graphql/mutations/mutation-add-review-deck"

/** What the write answers. */
export type AddReviewDeckResult = { readonly deckId: string; readonly added: boolean; readonly newCards: number }

/** Cache identity of the AddReviewDeck write. */
export const MUTATE_ADD_REVIEW_DECK_SWR_KEY = "MUTATE_ADD_REVIEW_DECK_SWR"

/** The input of one AddReviewDeck write. */
export interface AddReviewDeckArgument {
    readonly deckId: string
}

/** The extra argument SWR hands the fetcher. */
interface AddReviewDeckExtra {
    readonly arg: AddReviewDeckArgument
}

/** Adds a deck to the reader's review. */
export const useMutateAddReviewDeckSwr = (): SWRMutationResponse<
    AddReviewDeckResult,
    unknown,
    string,
    AddReviewDeckArgument
> =>
    useSWRMutation<AddReviewDeckResult, unknown, string, AddReviewDeckArgument>(
        MUTATE_ADD_REVIEW_DECK_SWR_KEY,
        async (_key: string, { arg }: AddReviewDeckExtra) => {
            const { data } = await failing(() => mutateAddReviewDeck({ request: arg }))
            if (data === undefined) throw new Error("addReviewDeck answered no data")
            return data.addReviewDeck
        },
    )
