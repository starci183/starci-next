"use client"

import { useCallback } from "react"
import { useMutateGradeReviewCardSwr } from "@/hooks/swr"
import type { ReviewGrade, ReviewGradeResultView } from "@/modules/types"
import type { ReviewCardWork } from "./useReviewCardWork"
import { isReviewRevisionConflict } from "./review.shared"

/** What a grade needs. */
type ReviewGradeParams = {
    readonly itemId: string | undefined
    readonly work: ReviewCardWork
    readonly update: (change: (work: ReviewCardWork) => ReviewCardWork) => void
    readonly onGraded: (grade: ReviewGrade, result: ReviewGradeResultView) => void
    /** Reads the item again, after the revision moved on. */
    readonly reload: () => void
}

/** The grade of the item on screen. */
export type ReviewGradeAction = {
    readonly isGrading: boolean
    readonly grade: (grade: ReviewGrade) => void
    /** Sends the last grade again after a failed save. */
    readonly retry: () => void
}

/** Stores the self-grade of the revealed item; a failed save keeps the item on screen and can be retried. */
export const useReviewGrade = (params: ReviewGradeParams): ReviewGradeAction => {
    const { itemId, work, update, onGraded, reload } = params
    const grader = useMutateGradeReviewCardSwr()
    const grade = useCallback(
        (each: ReviewGrade) => {
            if (work.flipped === undefined || itemId === undefined || grader.isMutating) return
            update((before) => ({ ...before, isGradeFailed: false, lastGrade: each }))
            const checked = Object.values(work.clozeResults)
            void grader
                .trigger({
                    itemId,
                    revision: work.flipped.revision,
                    grade: each,
                    ...(checked.length === 0 ? {} : { clozeCorrect: checked.every(Boolean) }),
                })
                .then((result) => onGraded(each, result))
                .catch((error: unknown) => {
                    update((before) => ({ ...before, isGradeFailed: true }))
                    if (isReviewRevisionConflict(error)) reload()
                })
        },
        [grader, itemId, onGraded, reload, update, work.clozeResults, work.flipped],
    )
    const retry = useCallback(() => {
        if (work.lastGrade !== undefined) grade(work.lastGrade)
    }, [grade, work.lastGrade])
    return { isGrading: grader.isMutating, grade, retry }
}
