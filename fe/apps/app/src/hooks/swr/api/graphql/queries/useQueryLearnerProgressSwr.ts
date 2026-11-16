"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type LearnerProgressQuery } from "@/modules/api"
import { queryLearnerProgress } from "@/modules/api/graphql/queries/query-learner-progress"

/** Cache identity of the progress read; the viewer and the locale are part of the key. */
export const QUERY_LEARNER_PROGRESS_SWR_KEY = "QUERY_LEARNER_PROGRESS_SWR"

/** Everything the progress screen shows. */
export type LearnerProgress = LearnerProgressQuery["learnerProgress"]

/** Reads the progress of the signed-in learner across the app in one locale; a failure stays the read's error. */
export const useQueryLearnerProgressSwr = (locale: string): SWRResponse<LearnerProgress> =>
    useSWR<LearnerProgress>(viewerKey(`${QUERY_LEARNER_PROGRESS_SWR_KEY}:${locale}`, useViewerId()), async () => {
        const { data } = await failing(() => queryLearnerProgress({ request: { locale } }))
        if (data === undefined) throw new Error("learnerProgress answered no data")
        return data.learnerProgress
    })
