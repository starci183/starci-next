"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLessonAttempt } from "@/modules/api/graphql/queries/query-lesson-attempt"
import { attemptOf } from "@/modules/lesson-view"
import type { AttemptView } from "@/modules/types"

/** Cache identity of the attempt read; the viewer and the attempt are part of the key. */
export const QUERY_LESSON_ATTEMPT_SWR_KEY = "QUERY_LESSON_ATTEMPT_SWR"

/** How often a grading attempt is read again. */
const GRADING_POLL_MS = 2000

/** Reads one attempt, again every two seconds while it is grading; the read waits while no attempt is named. */
export const useGetLessonAttemptSwr = (attemptId: string | undefined): SWRResponse<AttemptView> => {
    const viewer = viewerKey(QUERY_LESSON_ATTEMPT_SWR_KEY, useViewerId())
    return useSWR<AttemptView>(
        viewer === null || attemptId === undefined ? null : [...viewer, attemptId],
        async () => {
            const { data } = await failing(() => queryLessonAttempt({ request: { attemptId: attemptId ?? "" } }))
            if (data === undefined) throw new Error("attempt answered no data")
            return attemptOf(data.lessonAttempt)
        },
        { refreshInterval: (data) => (data?.status === "grading" ? GRADING_POLL_MS : 0) },
    )
}
