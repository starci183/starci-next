"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLessonOpenerScores } from "@/modules/api/graphql/queries/query-lesson-opener-scores"
import { openerScoresOf } from "@/modules/lesson-view"
import type { OpenerScoreView } from "@/modules/types"

/** Cache identity of the opener scores; the viewer and the lesson ids are part of the key. */
export const QUERY_LESSON_OPENER_SCORES_SWR_KEY = "QUERY_LESSON_OPENER_SCORES_SWR"

/** Reads the five-question opener scores (before and after) of some lessons, by lesson id; waits while there is none to ask. */
export const useQueryLessonOpenerScoresSwr = (
    lessonIds: ReadonlyArray<string>,
): SWRResponse<Readonly<Record<string, OpenerScoreView>>> => {
    const viewer = viewerKey(QUERY_LESSON_OPENER_SCORES_SWR_KEY, useViewerId())
    return useSWR<Readonly<Record<string, OpenerScoreView>>>(
        viewer === null || lessonIds.length === 0 ? null : [...viewer, ...lessonIds],
        async () => {
            const { data } = await failing(() => queryLessonOpenerScores({ request: { lessonIds: [...lessonIds] } }))
            if (data === undefined) throw new Error("lessonOpenerScores answered no data")
            return openerScoresOf(data)
        },
    )
}
