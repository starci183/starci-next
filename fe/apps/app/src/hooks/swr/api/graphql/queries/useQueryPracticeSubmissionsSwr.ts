"use client"

import { viewerKey } from "@starci/next-data"
import useSWRInfinite, { type SWRInfiniteResponse } from "swr/infinite"
import { useViewerId } from "@/hooks/viewer"
import { failing, type PracticeSubmissionsQuery } from "@/modules/api"
import { queryPracticeSubmissions } from "@/modules/api/graphql/queries/query-practice-submissions"

/** Cache identity of the submission history read; the viewer, the pattern and the locale are part of the key. */
export const QUERY_PRACTICE_SUBMISSIONS_SWR_KEY = "QUERY_PRACTICE_SUBMISSIONS_SWR"

/** One page of the history of submissions. */
export type PracticeSubmissionsPage = PracticeSubmissionsQuery["practiceSubmissions"]

/** Reads the learner own submissions in a pattern, one page at a time; the next page opens with `setSize`. */
export const useQueryPracticeSubmissionsSwr = (
    patternId: string | undefined,
    locale: string,
): SWRInfiniteResponse<PracticeSubmissionsPage> => {
    const viewer = viewerKey(QUERY_PRACTICE_SUBMISSIONS_SWR_KEY, useViewerId())
    return useSWRInfinite<PracticeSubmissionsPage>(
        (_index, previous) => {
            if (viewer === null || patternId === undefined) return null
            if (previous !== null && previous.nextCursor === null) return null
            return [...viewer, patternId, locale, previous?.nextCursor ?? ""]
        },
        async (key) => {
            const cursor = key[key.length - 1]
            const { data } = await failing(() =>
                queryPracticeSubmissions({
                    request: {
                        patternId: key[key.length - 3] ?? "",
                        locale,
                        cursor: cursor === "" ? null : (cursor ?? null),
                        limit: 20,
                    },
                }),
            )
            if (data === undefined) throw new Error("practiceSubmissions answered no data")
            return data.practiceSubmissions
        },
    )
}
