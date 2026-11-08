"use client"

import { useLocale } from "next-intl"
import { useCallback, useState } from "react"
import {
    useMutateAddReviewDeckSwr,
    useMutateRemoveReviewDeckSwr,
    useQueryReviewDecksSwr,
    useQueryReviewTodaySwr,
} from "@/hooks/swr"
import type { ReviewDeckView } from "@/modules/types"

/** What happened to the last deck the learner added or removed. */
export type ReviewDeckResult = { readonly kind: "added" | "removed" | "failed"; readonly count: number }

/** The add and remove actions of the decks screen. */
export type ReviewDeckActions = {
    readonly result: ReviewDeckResult | undefined
    readonly pendingId: string | undefined
    readonly toggle: (deck: ReviewDeckView) => void
}

/** Adds or removes a deck, then reads the decks and the queue of today again so both show the change. */
export const useReviewDeckActions = (): ReviewDeckActions => {
    const locale = useLocale()
    const decks = useQueryReviewDecksSwr(locale)
    const today = useQueryReviewTodaySwr(locale)
    const adder = useMutateAddReviewDeckSwr()
    const remover = useMutateRemoveReviewDeckSwr()
    const [result, setResult] = useState<ReviewDeckResult | undefined>(undefined)
    const [pendingId, setPendingId] = useState<string | undefined>(undefined)
    const refreshDecks = decks.mutate
    const refreshToday = today.mutate
    const toggle = useCallback(
        (deck: ReviewDeckView) => {
            setPendingId(deck.deckId)
            setResult(undefined)
            const work = deck.added
                ? remover
                      .trigger({ deckId: deck.deckId })
                      .then((done): ReviewDeckResult => ({ kind: "removed", count: done.suspended }))
                : adder
                      .trigger({ deckId: deck.deckId })
                      .then((done): ReviewDeckResult => ({ kind: "added", count: done.newCards }))
            void work
                .then((done) => {
                    setResult(done)
                    return Promise.all([refreshDecks(), refreshToday()])
                })
                .catch(() => setResult({ kind: "failed", count: 0 }))
                .finally(() => setPendingId(undefined))
        },
        [adder, refreshDecks, refreshToday, remover],
    )
    return { result, pendingId, toggle }
}
