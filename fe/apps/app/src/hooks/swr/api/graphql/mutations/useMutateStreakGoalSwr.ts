"use client"

import useSWRMutation, { type SWRMutationResponse } from "swr/mutation"
import { failing, type SetStreakGoalMutation } from "@/modules/api"
import { mutateSetStreakGoal } from "@/modules/api/graphql/mutations/mutation-set-streak-goal"

/** Cache identity of the weekly-goal write. */
export const MUTATE_STREAK_GOAL_SWR_KEY = "MUTATE_STREAK_GOAL_SWR"

/** What one write takes: the active days a week, 2 to 7, and the reminder to keep (null leaves none). */
export interface StreakGoalArgument {
    readonly activeDays: number
    readonly reminder: { readonly enabled: boolean; readonly localTime: string } | null
}

/** The extra argument SWR hands the fetcher. */
interface StreakGoalExtra {
    readonly arg: StreakGoalArgument
}

/** What the write answers. */
export type StreakGoalResult = SetStreakGoalMutation["setStreakGoal"]

/** Sets the weekly goal of the streak. */
export const useMutateStreakGoalSwr = (): SWRMutationResponse<StreakGoalResult, unknown, string, StreakGoalArgument> =>
    useSWRMutation<StreakGoalResult, unknown, string, StreakGoalArgument>(
        MUTATE_STREAK_GOAL_SWR_KEY,
        async (_key: string, { arg }: StreakGoalExtra) => {
            const { data } = await failing(() =>
                mutateSetStreakGoal({ request: { activeDays: arg.activeDays, reminder: arg.reminder } }),
            )
            if (data === undefined) throw new Error("setStreakGoal answered no data")
            return data.setStreakGoal
        },
    )
