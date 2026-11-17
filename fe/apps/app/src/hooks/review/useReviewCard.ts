"use client"

import { useLocale } from "next-intl"
import { useCallback } from "react"
import {
    useMutateCheckReviewClozeSwr,
    useMutateFlipReviewCardSwr,
    useMutateSubmitReviewRetrievalSwr,
    useQueryRecallItemSwr,
} from "@/hooks/swr"
import type { ReviewGrade, ReviewGradeResultView } from "@/modules/types"
import { isReviewAnswerInvalid, isReviewAnswerSoon, isReviewLocked } from "./review.shared"
import { useReviewCardWork, type ReviewCardWork } from "./useReviewCardWork"
import { useReviewGrade, type ReviewGradeAction } from "./useReviewGrade"
import { useReviewShortcuts } from "./useReviewShortcuts"

/** The work of the learner on one item: what they typed, the cloze checks, the revealed answer and where saving stands. */
export type ReviewCard = {
    readonly item: ReturnType<typeof useQueryRecallItemSwr>
    /** True when the read says the item is behind Premium. */
    readonly isLocked: boolean
    readonly work: ReviewCardWork
    readonly isFlipping: boolean
    readonly setNote: (text: string) => void
    readonly pick: (n: number, choice: string) => void
    readonly flip: () => void
    readonly submitAnswer: () => void
    readonly gradeAction: ReviewGradeAction
}

/** What the card hook needs: the item of this step and what to do when it is graded. */
type ReviewCardParams = {
    readonly itemId: string | undefined
    readonly step: number
    readonly onGraded: (grade: ReviewGrade, result: ReviewGradeResultView) => void
}

/** The hook of the item on screen. A new step starts clean, so a returning item starts clean too. */
export const useReviewCard = (params: ReviewCardParams): ReviewCard => {
    const locale = useLocale() === "en" ? "en" : "vi"
    const itemId = params.itemId
    const item = useQueryRecallItemSwr(locale, itemId, params.step)
    const [work, update] = useReviewCardWork(params.step)
    const cloze = useMutateCheckReviewClozeSwr()
    const flipper = useMutateFlipReviewCardSwr()
    const retrieval = useMutateSubmitReviewRetrievalSwr()
    const data = item.data
    const isRetrieval = data?.source === "retrieval"
    const reload = useCallback(() => void item.mutate(), [item])
    const gradeAction = useReviewGrade({ itemId, work, update, onGraded: params.onGraded, reload })

    const pick = useCallback(
        (n: number, choice: string) => {
            if (itemId === undefined) return
            update((before) => ({ ...before, picks: { ...before.picks, [n]: choice } }))
            const settle = (isCorrect: boolean): void =>
                update((before) => ({ ...before, clozeResults: { ...before.clozeResults, [n]: isCorrect } }))
            void cloze
                .trigger({ itemId, locale, n, choice })
                .then((result) => settle(result.correct))
                .catch(() => settle(false))
        },
        [cloze, itemId, locale, update],
    )

    const flip = useCallback(() => {
        if (itemId === undefined || work.flipped !== undefined || isRetrieval || flipper.isMutating) return
        update((before) => ({ ...before, issue: "none" }))
        void flipper
            .trigger({ itemId, locale })
            .then((flipped) => update((before) => ({ ...before, flipped })))
            .catch(() => update((before) => ({ ...before, issue: "failed" })))
    }, [flipper, isRetrieval, itemId, locale, update, work.flipped])

    const submitAnswer = useCallback(() => {
        if (itemId === undefined || data === undefined || retrieval.isMutating || work.note.trim() === "") return
        update((before) => ({ ...before, issue: "none" }))
        void retrieval
            .trigger({ itemId, locale, revision: data.revision, text: work.note })
            .then((flipped) => update((before) => ({ ...before, flipped })))
            .catch((error: unknown) => {
                let issue: ReviewCardWork["issue"] = "failed"
                if (isReviewAnswerSoon(error)) issue = "soon"
                else if (isReviewAnswerInvalid(error)) issue = "invalid"
                update((before) => ({ ...before, issue }))
            })
    }, [data, itemId, locale, retrieval, update, work.note])

    useReviewShortcuts({
        canFlip: data !== undefined && !isRetrieval && work.flipped === undefined,
        canGrade: work.flipped !== undefined,
        flip,
        grade: gradeAction.grade,
    })

    return {
        item,
        isLocked: item.error !== undefined && isReviewLocked(item.error),
        work,
        isFlipping: flipper.isMutating || retrieval.isMutating,
        setNote: (note) => update((before) => ({ ...before, note })),
        pick,
        flip,
        submitAnswer,
        gradeAction,
    }
}
