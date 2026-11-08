"use client"

import { useDocumentTitle } from "@/hooks/title"
import { useSlotLabels } from "@/hooks/slot"
import type { DataSlot, ReviewGradeButton, ReviewSessionLabels, ReviewSessionScreen, SlotLabels } from "@/modules/types"
import { itemScreenOf, summaryOf } from "./reviewView.shared"
import {
    useReviewCard,
    useReviewSession,
    sessionLabelsOf,
    useReviewWords,
    type ReviewCard,
    type ReviewSessionState,
    type ReviewWords,
} from "@/hooks/review"

/** What the connected session hands its pure half. */
export type ReviewSessionViewState = {
    readonly slot: DataSlot<ReviewSessionScreen>
    readonly slotLabels: SlotLabels
    readonly labels: ReviewSessionLabels
    readonly percent: number
    readonly setNote: (text: string) => void
    readonly pick: (n: number, choice: string) => void
    readonly flip: () => void
    readonly submitAnswer: () => void
    readonly grade: (grade: ReviewGradeButton["grade"]) => void
    readonly skip: () => void
    readonly retry: () => void
}

/** What the body of the session shows: the read states first, then the item, the locked notice or the summary. */
const slotOf = (session: ReviewSessionState, card: ReviewCard, words: ReviewWords): DataSlot<ReviewSessionScreen> => {
    if (session.today.error !== undefined) return { isError: true }
    if (session.data === undefined) return { isLoading: true }
    if (session.isDone) return session.total === 0 ? { isEmpty: true } : { items: summaryOf(session.tally, words) }
    if (card.isLocked) return { items: { kind: "locked" } }
    if (card.item.error !== undefined) return { isError: true }
    return card.item.data === undefined ? { isLoading: true } : { items: itemScreenOf(card.item.data, card, words) }
}

/** Walks the queue of today: the session, the item on screen and the words of both. */
export const useReviewSessionView = (): ReviewSessionViewState => {
    const words = useReviewWords()
    const session = useReviewSession()
    const card = useReviewCard({ itemId: session.itemId, step: session.step, onGraded: session.onGraded })
    const slotLabels = useSlotLabels()(words.t("session.emptyTitle"))
    useDocumentTitle(words.t("session.pageTitle"))
    const position = Math.min(session.step + 1, session.total)
    return {
        slot: slotOf(session, card, words),
        slotLabels,
        labels: sessionLabelsOf(words, words.t("session.progress", { position, total: session.total })),
        percent: session.total === 0 ? 0 : Math.round((Math.min(session.step, session.total) / session.total) * 100),
        setNote: card.setNote,
        pick: card.pick,
        flip: card.flip,
        submitAnswer: card.submitAnswer,
        grade: card.gradeAction.grade,
        skip: session.onSkip,
        retry: () => {
            if (card.item.error !== undefined) void card.item.mutate()
            else if (session.today.error !== undefined) void session.today.mutate()
            else card.gradeAction.retry()
        },
    }
}
