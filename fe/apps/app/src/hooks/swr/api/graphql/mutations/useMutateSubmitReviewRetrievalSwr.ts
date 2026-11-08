"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateSubmitReviewRetrieval } from "@/modules/api/graphql/mutations/mutation-submit-review-retrieval"
import type { ReviewFlipView } from "@/modules/types"

/** Cache identity of the SubmitReviewRetrieval write. */
export const MUTATE_SUBMIT_REVIEW_RETRIEVAL_SWR_KEY = "MUTATE_SUBMIT_REVIEW_RETRIEVAL_SWR"

/** The input of one SubmitReviewRetrieval write. */
export interface SubmitReviewRetrievalArgument {
    readonly itemId: string
    readonly locale: string
    readonly revision: number
    readonly text: string
}

/** The extra argument SWR hands the fetcher. */
interface SubmitReviewRetrievalExtra {
    readonly arg: SubmitReviewRetrievalArgument
}

/** Stores the written answer of a retrieval item, then reveals the sample answer. */
export const useMutateSubmitReviewRetrievalSwr = (): SWRMutationResponse<
    ReviewFlipView,
    unknown,
    string,
    SubmitReviewRetrievalArgument
> =>
    useSWRMutation<ReviewFlipView, unknown, string, SubmitReviewRetrievalArgument>(
        MUTATE_SUBMIT_REVIEW_RETRIEVAL_SWR_KEY,
        async (_key: string, { arg }: SubmitReviewRetrievalExtra) => {
            const { data } = await failing(() => mutateSubmitReviewRetrieval({ request: arg }))
            if (data === undefined) throw new Error("submitReviewRetrieval answered no data")
            return data.submitReviewRetrieval
        },
    )
