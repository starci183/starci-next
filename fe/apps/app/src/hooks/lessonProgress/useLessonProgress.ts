"use client"

import { useGetLessonAttemptSwr, useGetLessonProgressSwr } from "@/hooks/swr"
import type { AttemptView, ProgressView } from "@/modules/types"

/** What useLessonProgress answers: the progress in the lesson and the attempt at its opening diagnostic. */
type LessonProgress = {
    readonly progress: ProgressView | undefined
    readonly challenge: AttemptView | undefined
}

/**
 * The learner progress in one lesson and, to set beside the reflection, the attempt at the opening diagnostic, found through
 * the latest attempt of the challenge phase.
 */
export const useLessonProgress = (lessonId: string): LessonProgress => {
    const progress = useGetLessonProgressSwr([lessonId]).data?.[lessonId]
    const challengeId = progress?.activities.find((activity) => activity.phase === "challenge")?.latestAttemptId
    return { progress, challenge: useGetLessonAttemptSwr(challengeId).data }
}
