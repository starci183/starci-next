"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type LearnerHubQuery } from "@/modules/api"
import { queryLearnerHub } from "@/modules/api/graphql/queries/query-learner-hub"

/** Cache identity of the hub read; the viewer and the locale are part of the key. */
export const QUERY_LEARNER_HUB_SWR_KEY = "QUERY_LEARNER_HUB_SWR"

/** Everything the learn hub shows. */
export type LearnerHub = LearnerHubQuery["learnerHub"]

/** Reads the hub in one locale; a failure stays the read's error. */
export const useQueryLearnerHubSwr = (locale: string): SWRResponse<LearnerHub> => {
    const viewer = viewerKey(QUERY_LEARNER_HUB_SWR_KEY, useViewerId())
    const key = viewer === null ? null : [...viewer, locale]
    return useSWR<LearnerHub>(key, async () => {
        const { data } = await failing(() => queryLearnerHub({ request: { locale } }))
        if (data === undefined) throw new Error("learnerHub answered no data")
        return data.learnerHub
    })
}
