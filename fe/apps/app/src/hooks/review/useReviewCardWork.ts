"use client"

import { useCallback, useState } from "react"
import type { ReviewFlipView, ReviewGrade } from "@/modules/types"

/** Why the written answer could not be handled. */
export type ReviewCardIssue = "none" | "soon" | "invalid" | "failed"

/** What the learner holds for one step of the session. */
export type ReviewCardWork = {
    readonly step: number
    readonly note: string
    readonly picks: Readonly<Record<number, string>>
    readonly clozeResults: Readonly<Record<number, boolean>>
    readonly flipped: ReviewFlipView | undefined
    readonly issue: ReviewCardIssue
    readonly isGradeFailed: boolean
    readonly lastGrade: ReviewGrade | undefined
}

/** The work of a step nobody touched yet. */
const freshWork = (step: number): ReviewCardWork => ({
    step,
    note: "",
    picks: {},
    clozeResults: {},
    flipped: undefined,
    issue: "none",
    isGradeFailed: false,
    lastGrade: undefined,
})

/** The work on the item of this step and the way to change it; a new step starts clean, so a returning item is never stale. */
export const useReviewCardWork = (
    step: number,
): readonly [ReviewCardWork, (change: (work: ReviewCardWork) => ReviewCardWork) => void] => {
    const [stored, setStored] = useState<ReviewCardWork>(freshWork(step))
    const work = stored.step === step ? stored : freshWork(step)
    const update = useCallback(
        (change: (current: ReviewCardWork) => ReviewCardWork) =>
            setStored((before) => change(before.step === step ? before : freshWork(step))),
        [step],
    )
    return [work, update]
}
