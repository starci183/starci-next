"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryPracticeProblems } from "@/modules/api/graphql/queries/query-practice-problems"
import { practiceProblemItemsOf } from "@/modules/practice-view"
import type { PracticeProblemItemView } from "@/modules/types"

/** Cache identity of the problems-of-a-pattern read; the viewer, the pattern and the locale are part of the key. */
export const QUERY_PRACTICE_PROBLEMS_SWR_KEY = "QUERY_PRACTICE_PROBLEMS_SWR"

/** Reads the problems of one pattern with the reader's status on each; an unknown pattern is the read's error. */
export const useQueryPracticeProblemsSwr = (
    patternId: string | undefined,
    locale: string,
): SWRResponse<ReadonlyArray<PracticeProblemItemView>> => {
    const viewer = viewerKey(QUERY_PRACTICE_PROBLEMS_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<PracticeProblemItemView>>(
        viewer === null || patternId === undefined ? null : [...viewer, patternId, locale],
        async () => {
            const { data } = await failing(() =>
                queryPracticeProblems({ request: { patternId: patternId ?? "", locale } }),
            )
            if (data === undefined) throw new Error("practiceProblems answered no data")
            return practiceProblemItemsOf(data)
        },
    )
}
