"use client"

import { useLocale } from "next-intl"
import { useCallback, useState } from "react"
import { useMutateSetReviewGoalSwr, useQueryReviewTodaySwr } from "@/hooks/swr"
import type { ReviewGoalForm } from "@/modules/types"
import { REVIEW_GOAL_BOUNDS } from "./review.shared"

/** The goal form of the decks screen with its two actions. */
export type ReviewGoalState = {
    readonly form: ReviewGoalForm
    readonly setGoal: (value: number) => void
    readonly saveGoal: () => void
}

/** The daily goal: the number being edited, its check against 5 to 50 and the save. */
export const useReviewGoal = (): ReviewGoalState => {
    const today = useQueryReviewTodaySwr(useLocale())
    const writer = useMutateSetReviewGoalSwr()
    const [draft, setDraft] = useState<number | undefined>(undefined)
    const [state, setState] = useState<ReviewGoalForm["state"]>("idle")
    const value = draft ?? today.data?.goal.daily ?? 10
    const refresh = today.mutate
    const saveGoal = useCallback(() => {
        if (value < REVIEW_GOAL_BOUNDS.min || value > REVIEW_GOAL_BOUNDS.max) {
            setState("invalid")
            return
        }
        void writer
            .trigger({ daily: value })
            .then(() => {
                setState("saved")
                return refresh()
            })
            .catch(() => setState("failed"))
    }, [refresh, value, writer])
    return {
        form: { value, ...REVIEW_GOAL_BOUNDS, state, isSaving: writer.isMutating },
        setGoal: (next) => {
            setDraft(next)
            setState("idle")
        },
        saveGoal,
    }
}
