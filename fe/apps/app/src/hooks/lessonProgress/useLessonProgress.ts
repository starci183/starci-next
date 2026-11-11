"use client"

import { useCallback } from "react"
import { useGetLessonProgressSwr } from "@/hooks/swr"
import type { ProgressView } from "@/modules/types"

/** What useLessonProgress answers: the progress in the lesson, as the server keeps it, and the way to read it again. */
type LessonProgress = {
    readonly progress: ProgressView | undefined
    /** Reads the progress again. */
    readonly refresh: () => void
}

/**
 * The learner progress in one lesson: the outcomes and phases as the server decides them, the latest attempt of each answered activity
 * (so a reload brings back the answers and grades), the walks of the simulations, the completion and the reviews. The caller reads again after
 * every submit, so the cards and the aside update without a reload; the read repeats by itself while an attempt is being graded.
 */
export const useLessonProgress = (lessonId: string, locale: string): LessonProgress => {
    const read = useGetLessonProgressSwr([lessonId], locale)
    const { mutate } = read
    const refresh = useCallback(() => {
        void mutate()
    }, [mutate])
    return { progress: read.data?.[lessonId], refresh }
}
