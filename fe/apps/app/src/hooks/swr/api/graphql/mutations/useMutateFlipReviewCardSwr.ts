"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateFlipReviewCard } from "@/modules/api/graphql/mutations/mutation-flip-review-card"
import type { ReviewFlipView } from "@/modules/types"

/** Cache identity of the FlipReviewCard write. */
export const MUTATE_FLIP_REVIEW_CARD_SWR_KEY = "MUTATE_FLIP_REVIEW_CARD_SWR"

/** The input of one FlipReviewCard write. */
export interface FlipReviewCardArgument {
    readonly itemId: string
    readonly locale: string
}

/** The extra argument SWR hands the fetcher. */
interface FlipReviewCardExtra {
    readonly arg: FlipReviewCardArgument
}

/** Reveals the answer of a card; nothing is graded. */
export const useMutateFlipReviewCardSwr = (): SWRMutationResponse<
    ReviewFlipView,
    unknown,
    string,
    FlipReviewCardArgument
> =>
    useSWRMutation<ReviewFlipView, unknown, string, FlipReviewCardArgument>(
        MUTATE_FLIP_REVIEW_CARD_SWR_KEY,
        async (_key: string, { arg }: FlipReviewCardExtra) => {
            const { data } = await failing(() => mutateFlipReviewCard({ request: arg }))
            if (data === undefined) throw new Error("flipReviewCard answered no data")
            return data.flipReviewCard
        },
    )
