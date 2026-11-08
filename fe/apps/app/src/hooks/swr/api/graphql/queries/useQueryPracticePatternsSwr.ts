"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryPracticePatterns } from "@/modules/api/graphql/queries/query-practice-patterns"
import type { PracticePatternRow } from "@/modules/types"

/** Cache identity of the practice patterns read; the viewer and the locale are part of the key. */
export const QUERY_PRACTICE_PATTERNS_SWR_KEY = "QUERY_PRACTICE_PATTERNS_SWR"

/** Reads the practice patterns with the reader's accepted count in each. */
export const useQueryPracticePatternsSwr = (locale: string): SWRResponse<ReadonlyArray<PracticePatternRow>> => {
    const viewer = viewerKey(QUERY_PRACTICE_PATTERNS_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<PracticePatternRow>>(viewer === null ? null : [...viewer, locale], async () => {
        const { data } = await failing(() => queryPracticePatterns({ request: { locale } }))
        if (data === undefined) throw new Error("practicePatterns answered no data")
        return data.practicePatterns
    })
}
