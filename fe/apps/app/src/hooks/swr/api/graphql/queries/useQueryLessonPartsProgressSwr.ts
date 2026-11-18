"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLessonPartsProgress } from "@/modules/api/graphql/queries/query-lesson-parts-progress"
import { lessonPartsOf } from "@/modules/lesson-view"
import type { LessonPartsView } from "@/modules/types"

/** Cache identity of the parts progress; the viewer and the lesson ids are part of the key. */
export const QUERY_LESSON_PARTS_PROGRESS_SWR_KEY = "QUERY_LESSON_PARTS_PROGRESS_SWR"

/** The most lessons the back end answers in one read. */
const MAX_LESSONS = 50

/** Reads the learner's progress in the four parts of many lessons at once, by lesson id; waits while there is no lesson to ask about. */
export const useQueryLessonPartsProgressSwr = (
    lessonIds: ReadonlyArray<string>,
): SWRResponse<Readonly<Record<string, LessonPartsView>>> => {
    const viewer = viewerKey(QUERY_LESSON_PARTS_PROGRESS_SWR_KEY, useViewerId())
    const ids = lessonIds.slice(0, MAX_LESSONS)
    return useSWR<Readonly<Record<string, LessonPartsView>>>(
        viewer === null || ids.length === 0 ? null : [...viewer, ...ids],
        async () => {
            const { data } = await failing(() => queryLessonPartsProgress({ request: { lessonIds: [...ids] } }))
            if (data === undefined) throw new Error("lessonPartsProgress answered no data")
            return lessonPartsOf(data)
        },
    )
}
