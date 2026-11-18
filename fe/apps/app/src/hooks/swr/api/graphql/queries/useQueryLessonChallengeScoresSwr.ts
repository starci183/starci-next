"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryLessonChallengeScores } from "@/modules/api/graphql/queries/query-lesson-challenge-scores"
import { challengeScoresOf } from "@/modules/lesson-view"
import type { ChallengeScoreView } from "@/modules/types"

/** Cache identity of the challenge scores; the viewer and the lesson are part of the key. */
export const QUERY_LESSON_CHALLENGE_SCORES_SWR_KEY = "QUERY_LESSON_CHALLENGE_SCORES_SWR"

/** How often the scores are read again: a hidden run on the learner's machine moves them. */
const POLL_MS = 4000

/** Reads the score of each rung of a lesson's ladder; `isEnabled` is false while Tự áp dụng is locked or off screen. */
export const useQueryLessonChallengeScoresSwr = (
    lessonId: string,
    isEnabled: boolean,
): SWRResponse<ReadonlyArray<ChallengeScoreView>> => {
    const viewer = viewerKey(QUERY_LESSON_CHALLENGE_SCORES_SWR_KEY, useViewerId())
    return useSWR<ReadonlyArray<ChallengeScoreView>>(
        viewer === null || !isEnabled ? null : [...viewer, lessonId],
        async () => {
            const { data } = await failing(() => queryLessonChallengeScores({ request: { lessonId } }))
            if (data === undefined) throw new Error("lessonChallengeScores answered no data")
            return challengeScoresOf(data)
        },
        { refreshInterval: POLL_MS },
    )
}
