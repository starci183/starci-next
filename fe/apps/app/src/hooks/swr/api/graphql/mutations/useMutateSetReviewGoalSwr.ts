"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing } from "@/modules/api"
import { mutateSetReviewGoal } from "@/modules/api/graphql/mutations/mutation-set-review-goal"

/** What the write answers. */
export type SetReviewGoalResult = { readonly daily: number }

/** Cache identity of the SetReviewGoal write. */
export const MUTATE_SET_REVIEW_GOAL_SWR_KEY = "MUTATE_SET_REVIEW_GOAL_SWR"

/** The input of one SetReviewGoal write. */
export interface SetReviewGoalArgument {
    readonly daily: number
}

/** The extra argument SWR hands the fetcher. */
interface SetReviewGoalExtra {
    readonly arg: SetReviewGoalArgument
}

/** Sets the daily review goal. */
export const useMutateSetReviewGoalSwr = (): SWRMutationResponse<
    SetReviewGoalResult,
    unknown,
    string,
    SetReviewGoalArgument
> =>
    useSWRMutation<SetReviewGoalResult, unknown, string, SetReviewGoalArgument>(
        MUTATE_SET_REVIEW_GOAL_SWR_KEY,
        async (_key: string, { arg }: SetReviewGoalExtra) => {
            const { data } = await failing(() => mutateSetReviewGoal({ request: arg }))
            if (data === undefined) throw new Error("setReviewGoal answered no data")
            return data.setReviewGoal
        },
    )
