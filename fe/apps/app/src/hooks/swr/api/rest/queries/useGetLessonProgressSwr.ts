"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLessonProgress } from "@/modules/api/graphql/queries/query-lesson-progress"
import { progressOf } from "@/modules/lesson-view"
import type { ProgressView } from "@/modules/types"

/** Cache identity of the progress read; the viewer and the lesson ids are part of the key. */
export const QUERY_LESSON_PROGRESS_SWR_KEY = "QUERY_LESSON_PROGRESS_SWR"

/**
 * Reads the learner progress in each of the given lessons, by lesson id. A lesson the learner has not touched answers an empty
 * progress. The read waits while there is no lesson to ask about.
 */
export const useGetLessonProgressSwr = (
    lessonIds: ReadonlyArray<string>,
): SWRResponse<Readonly<Record<string, ProgressView>>> => {
    const viewer = viewerKey(QUERY_LESSON_PROGRESS_SWR_KEY, useViewerId())
    return useSWR<Readonly<Record<string, ProgressView>>>(
        viewer === null || lessonIds.length === 0 ? null : [...viewer, ...lessonIds],
        async () => {
            const entries = await Promise.all(
                lessonIds.map(async (lessonId) => {
                    const { data } = await failing(() => queryLessonProgress({ request: { lessonId } }))
                    if (data === undefined) throw new Error("progress answered no data")
                    return [lessonId, progressOf(data)] as const
                }),
            )
            return Object.fromEntries(entries)
        },
    )
}
