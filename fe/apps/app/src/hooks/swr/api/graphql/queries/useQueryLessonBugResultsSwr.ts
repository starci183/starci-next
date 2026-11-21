"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLessonBugResults } from "@/modules/api/graphql/queries/query-lesson-bug-results"
import { bugResultOf } from "@/modules/lesson-view"
import type { BugResultView } from "@/modules/types"

/** Cache identity of the Tìm sạn results; the viewer, the lesson and the locale are part of the key. */
export const QUERY_LESSON_BUG_RESULTS_SWR_KEY = "QUERY_LESSON_BUG_RESULTS_SWR"

/** How often the results are read again while a test runs: the page follows the CLI live. */
const RUNNING_POLL_MS = 2000

/** How often the results are read again otherwise, so a run started from the terminal shows up without a reload. */
const IDLE_POLL_MS = 10_000

/** Reads every Tìm sạn test with the learner's newest relayed run; `isEnabled` is false while Tìm sạn is locked or off screen. */
export const useQueryLessonBugResultsSwr = (
    lessonId: string,
    locale: string,
    isEnabled: boolean,
): SWRResponse<ReadonlyArray<BugResultView>> => {
    const viewer = viewerKey(QUERY_LESSON_BUG_RESULTS_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<BugResultView>>(
        viewer === null || !isEnabled ? null : [...viewer, lessonId, locale],
        async () => {
            const { data } = await failing(() => queryLessonBugResults({ request: { lessonId, locale } }))
            if (data === undefined) throw new Error("lessonBugResults answered no data")
            return data.lessonBugResults.map((each) => bugResultOf(each))
        },
        {
            refreshInterval: (results) =>
                (results ?? []).some((result) => result.status === "running") ? RUNNING_POLL_MS : IDLE_POLL_MS,
        },
    )
}
