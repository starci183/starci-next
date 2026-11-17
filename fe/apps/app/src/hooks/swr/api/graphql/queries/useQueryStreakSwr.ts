"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type StreakQuery } from "@/modules/api"
import { queryStreak } from "@/modules/api/graphql/queries/query-streak"

/** Cache identity of the streak read; the viewer is part of the key because the streak is per learner. */
export const QUERY_STREAK_SWR_KEY = "QUERY_STREAK_SWR"

/** The streak of the signed-in learner. */
export type StreakSummary = StreakQuery["streak"]

/** Reads the streak; the key is null while the viewer is unknown, so a signed-out reader never asks. */
export const useQueryStreakSwr = (): SWRResponse<StreakSummary> => {
    const viewer = viewerKey(QUERY_STREAK_SWR_KEY, useViewerId())
    return useSWR<StreakSummary>(viewer, async () => {
        const { data } = await failing(() => queryStreak())
        if (data === undefined) throw new Error("streak answered no data")
        return data.streak
    })
}
