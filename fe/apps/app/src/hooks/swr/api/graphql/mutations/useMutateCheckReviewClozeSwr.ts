"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateCheckReviewCloze } from "@/modules/api/graphql/mutations/mutation-check-review-cloze"

/** What the write answers. */
export type CheckReviewClozeResult = { readonly correct: boolean }

/** Cache identity of the CheckReviewCloze write. */
export const MUTATE_CHECK_REVIEW_CLOZE_SWR_KEY = "MUTATE_CHECK_REVIEW_CLOZE_SWR"

/** The input of one CheckReviewCloze write. */
export interface CheckReviewClozeArgument {
    readonly itemId: string
    readonly locale: string
    readonly n: number
    readonly choice: string
}

/** The extra argument SWR hands the fetcher. */
interface CheckReviewClozeExtra {
    readonly arg: CheckReviewClozeArgument
}

/** Checks one picked cloze term. */
export const useMutateCheckReviewClozeSwr = (): SWRMutationResponse<
    CheckReviewClozeResult,
    unknown,
    string,
    CheckReviewClozeArgument
> =>
    useSWRMutation<CheckReviewClozeResult, unknown, string, CheckReviewClozeArgument>(
        MUTATE_CHECK_REVIEW_CLOZE_SWR_KEY,
        async (_key: string, { arg }: CheckReviewClozeExtra) => {
            const { data } = await failing(() => mutateCheckReviewCloze({ request: arg }))
            if (data === undefined) throw new Error("checkReviewCloze answered no data")
            return data.checkReviewCloze
        },
    )
