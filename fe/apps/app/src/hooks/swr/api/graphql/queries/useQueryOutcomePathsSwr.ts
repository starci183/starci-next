"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type OutcomePathsQuery } from "@/modules/api"
import { queryOutcomePaths } from "@/modules/api/graphql/queries/query-outcome-paths"

/** Cache identity of the outcome paths read; the viewer and the locale are part of the key. */
export const QUERY_OUTCOME_PATHS_SWR_KEY = "QUERY_OUTCOME_PATHS_SWR"

/** The five outcome paths and the one the learner follows. */
export type OutcomePaths = OutcomePathsQuery["outcomePaths"]

/** Reads the outcome paths in one locale; a failure stays the read's error. */
export const useQueryOutcomePathsSwr = (locale: string): SWRResponse<OutcomePaths> => {
    const viewer = viewerKey(QUERY_OUTCOME_PATHS_SWR_KEY, useViewerId())
    return useSWR<OutcomePaths>(viewer === null ? null : [...viewer, locale], async () => {
        const { data } = await failing(() => queryOutcomePaths({ request: { locale } }))
        if (data === undefined) throw new Error("outcomePaths answered no data")
        return data.outcomePaths
    })
}
