"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryPracticeProblem } from "@/modules/api/graphql/queries/query-practice-problem"
import { practiceProblemOf } from "@/modules/practice-view"
import type { PracticeProblemView } from "@/modules/types"

/** Cache identity of the problem read; the viewer, the problem and the locale are part of the key. */
export const QUERY_PRACTICE_PROBLEM_SWR_KEY = "QUERY_PRACTICE_PROBLEM_SWR"

/** Reads one problem; hidden tests and solutions never travel in it. */
export const useQueryPracticeProblemSwr = (slug: string, locale: string): SWRResponse<PracticeProblemView> => {
    const viewer = viewerKey(QUERY_PRACTICE_PROBLEM_SWR_KEY, useViewerId())
    return useSWR<PracticeProblemView>(viewer === null ? null : [...viewer, slug, locale], async () => {
        const { data } = await failing(() => queryPracticeProblem({ request: { slug, locale } }))
        if (data === undefined) throw new Error("practiceProblem answered no data")
        return practiceProblemOf(data)
    })
}
