"use client"

import { useLocale } from "next-intl"
import { useCallback, useState } from "react"
import { useQueryReviewTodaySwr } from "@/hooks/swr"
import type { ReviewGrade, ReviewGradeResultView, ReviewTodayView } from "@/modules/types"

/** What the learner did so far in the session. */
export type ReviewTally = {
    readonly reviewed: number
    readonly remembered: number
    /** The goal and the items left today, as the last stored grade answered them. */
    readonly last: Pick<ReviewGradeResultView, "goal" | "remainingToday"> | undefined
}

/** The session over the queue of today: a fixed list of items, the position in it and what was done. */
export type ReviewSessionState = {
    readonly today: ReturnType<typeof useQueryReviewTodaySwr>
    readonly data: ReviewTodayView | undefined
    /** The item on screen; undefined before the queue is read and once the queue is done. */
    readonly itemId: string | undefined
    /** The position in the session, counting an item that returns after a Forgot grade; it re-reads that item. */
    readonly step: number
    readonly total: number
    readonly isDone: boolean
    readonly tally: ReviewTally
    /** Moves on after a stored grade; a Forgot grade puts the item back at the end of the session. */
    readonly onGraded: (grade: ReviewGrade, result: ReviewGradeResultView) => void
    /** Moves on without grading (a locked item, or a written question that cannot be answered yet). */
    readonly onSkip: () => void
}

/** The items of today that a free or premium learner can review now, due first, then new. */
const openIdsOf = (today: ReviewTodayView | undefined): ReadonlyArray<string> | undefined =>
    today?.items.filter((item) => !item.locked).map((item) => item.itemId)

/** The session of the review of today; the read is frozen, so a grade never reshuffles the queue. */
export const useReviewSession = (): ReviewSessionState => {
    const today = useQueryReviewTodaySwr(useLocale(), true)
    const [step, setStep] = useState(0)
    const [returned, setReturned] = useState<ReadonlyArray<string>>([])
    const [tally, setTally] = useState<ReviewTally>({ reviewed: 0, remembered: 0, last: undefined })
    const base = openIdsOf(today.data)
    const queue = base === undefined ? undefined : [...base, ...returned]
    const itemId = queue?.[step]
    const onGraded = useCallback(
        (grade: ReviewGrade, result: ReviewGradeResultView) => {
            setTally((before) => ({
                reviewed: before.reviewed + 1,
                remembered: before.remembered + (grade === "GOOD" || grade === "EASY" ? 1 : 0),
                last: { goal: result.goal, remainingToday: result.remainingToday },
            }))
            if (grade === "AGAIN" && itemId !== undefined) setReturned((before) => [...before, itemId])
            setStep((before) => before + 1)
        },
        [itemId],
    )
    const onSkip = useCallback(() => setStep((before) => before + 1), [])
    return {
        today,
        data: today.data,
        itemId,
        step,
        total: queue?.length ?? 0,
        isDone: queue !== undefined && step >= queue.length,
        tally,
        onGraded,
        onSkip,
    }
}
