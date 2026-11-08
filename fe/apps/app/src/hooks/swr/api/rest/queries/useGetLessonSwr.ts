"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLesson } from "@/modules/api/graphql/queries/query-lesson"
import { lessonOf } from "@/modules/lesson-view"
import type { LessonView } from "@/modules/types"

/** Cache identity of the lesson read; the viewer, the lesson and the locale are part of the key. */
export const QUERY_LESSON_SWR_KEY = "QUERY_LESSON_SWR"

/** Reads one lesson's public projection in one locale through the lesson door, wrapped in SWR. */
export const useGetLessonSwr = (lessonId: string, locale: string, isEnabled = true): SWRResponse<LessonView> => {
    const viewer = viewerKey(QUERY_LESSON_SWR_KEY, useViewerId())
    return useSWR<LessonView>(viewer === null || !isEnabled ? null : [...viewer, lessonId, locale], async () => {
        const { data } = await failing(() => queryLesson({ request: { id: lessonId, locale } }))
        if (data === undefined) throw new Error("lesson answered no data")
        return lessonOf(data.lesson)
    })
}
