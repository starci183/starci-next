"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryPracticeNext } from "@/modules/api/graphql/queries/query-practice-next"
import type { PracticeNextView } from "@/modules/types"

/** Cache identity of the practice-next read; the viewer, the pattern and the locale are part of the key. */
export const QUERY_PRACTICE_NEXT_SWR_KEY = "QUERY_PRACTICE_NEXT_SWR"

/** Reads the next problem to solve and the unfinished one, in the whole catalog or in one pattern. */
export const useQueryPracticeNextSwr = (locale: string, patternId?: string): SWRResponse<PracticeNextView> => {
    const viewer = viewerKey(QUERY_PRACTICE_NEXT_SWR_KEY, useViewerId())
    return useSWR<PracticeNextView>(viewer === null ? null : [...viewer, patternId ?? "", locale], async () => {
        const { data } = await failing(() => queryPracticeNext({ request: { locale, patternId: patternId ?? null } }))
        if (data === undefined) throw new Error("practiceNext answered no data")
        return data.practiceNext
    })
}
