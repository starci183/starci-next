"use client"

import { useEffect } from "react"
import type { ReviewGrade } from "@/modules/types"
import { REVIEW_GRADE_ORDER, isTypingTarget } from "./review.shared"

/** What the shortcuts act on. */
type ReviewShortcutParams = {
    /** True while a card is on screen and not flipped yet. */
    readonly canFlip: boolean
    /** True once the answer is revealed. */
    readonly canGrade: boolean
    readonly flip: () => void
    readonly grade: (grade: ReviewGrade) => void
}

/** Space flips the card, 1 to 4 grade it; the keys are left alone while the learner types. */
export const useReviewShortcuts = (params: ReviewShortcutParams): void => {
    const { canFlip, canGrade, flip, grade } = params
    useEffect(() => {
        const onKey = (event: KeyboardEvent): void => {
            if (isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return
            if (event.key === " " && canFlip) {
                event.preventDefault()
                flip()
                return
            }
            const entry = REVIEW_GRADE_ORDER.find((each) => each.key === event.key)
            if (entry !== undefined && canGrade) grade(entry.grade)
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [canFlip, canGrade, flip, grade])
}
