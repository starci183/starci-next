"use client"

import { useLocale } from "next-intl"
import { useState } from "react"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryReviewDecksSwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import type {
    DataSlot,
    ReviewDeckCard,
    ReviewDeckNote,
    ReviewDecksLabels,
    ReviewDeckView,
    ReviewFilterOption,
    ReviewGoalForm,
    SlotLabels,
} from "@/modules/types"
import {
    courseLabelOf,
    useReviewDeckActions,
    useReviewGoal,
    useReviewWords,
    type ReviewDeckResult,
    type ReviewWords,
} from "@/hooks/review"
import { filterOptionsOf } from "./reviewView.shared"

/** What the connected decks screen hands its pure half. */
export type ReviewDecksViewState = {
    readonly slot: DataSlot<ReadonlyArray<ReviewDeckCard>>
    readonly slotLabels: SlotLabels
    readonly labels: ReviewDecksLabels
    readonly tracks: ReadonlyArray<ReviewFilterOption>
    readonly courses: ReadonlyArray<ReviewFilterOption>
    readonly track: string
    readonly course: string
    readonly note: ReviewDeckNote | undefined
    readonly goal: ReviewGoalForm
    readonly retry: () => void
    readonly setTrack: (track: string) => void
    readonly setCourse: (course: string) => void
    readonly toggle: (deckId: string) => void
    readonly setGoal: (value: number) => void
    readonly saveGoal: () => void
}

/** The fixed words of the decks screen. */
const labelsOf = (t: ReviewWords["t"]): ReviewDecksLabels => ({
    pageTitle: t("decks.pageTitle"),
    intro: t("decks.intro"),
    asideTitle: t("decks.asideTitle"),
    filterLabel: t("decks.filterLabel"),
    courseLabel: t("decks.courseLabel"),
    partlyLocked: t("decks.partlyLocked"),
    add: t("decks.add"),
    added: t("decks.added"),
    remove: t("decks.remove"),
    failed: t("decks.failed"),
    goalTitle: t("decks.goalTitle"),
    goalLabel: t("decks.goalLabel"),
    goalHelp: t("decks.goalHelp"),
    goalSave: t("decks.goalSave"),
    goalSaved: t("decks.goalSaved"),
    goalInvalid: t("decks.goalInvalid"),
    back: t("decks.back"),
})

/** The note under the page about the last add or remove. */
const noteOf = (result: ReviewDeckResult | undefined, t: ReviewWords["t"]): ReviewDeckNote | undefined => {
    if (result === undefined) return undefined
    if (result.kind === "failed") return { tone: "negative", text: t("decks.failed") }
    return {
        tone: "affirmative",
        text: t(result.kind === "added" ? "decks.addedNote" : "decks.removedNote", { count: result.count }),
    }
}

/** The words of one deck card. */
const cardOf = (deck: ReviewDeckView, pendingId: string | undefined, t: ReviewWords["t"]): ReviewDeckCard => ({
    id: deck.deckId,
    title: deck.title,
    description: deck.description,
    difficulty: deck.difficulty,
    cards: t("decks.cards", { count: deck.cardCount }),
    free: t("decks.free", { count: deck.freeCardCount }),
    isPartlyLocked: deck.freeCardCount < deck.cardCount,
    isAdded: deck.added,
    isPending: pendingId === deck.deckId,
})

/** Reads the decks and holds the filters, the add and remove actions and the goal form. */
export const useReviewDecksView = (): ReviewDecksViewState => {
    const words = useReviewWords()
    const t = words.t
    const read = useQueryReviewDecksSwr(useLocale())
    const actions = useReviewDeckActions()
    const goal = useReviewGoal()
    const [track, setTrack] = useState("all")
    const [course, setCourse] = useState("all")
    const slotLabels = useSlotLabels()(t("decks.empty"))
    useDocumentTitle(t("decks.pageTitle"))
    const matches = (deck: ReviewDeckView): boolean =>
        (track === "all" || deck.track.includes(track)) && (course === "all" || deck.course === course)
    const decks = read.data
    const trackLabel = (value: string): string => (t.has(`decks.tracks.${value}`) ? t(`decks.tracks.${value}`) : value)
    return {
        slot: mapSlot(slotOfSwr(read), (decks) =>
            decks.filter((each) => matches(each)).map((deck) => cardOf(deck, actions.pendingId, t)),
        ),
        slotLabels,
        labels: labelsOf(t),
        tracks: filterOptionsOf(
            t("decks.filterAll"),
            decks?.flatMap((deck) => deck.track),
            trackLabel,
        ),
        courses: filterOptionsOf(
            t("decks.courseAll"),
            decks?.map((deck) => deck.course),
            courseLabelOf,
        ),
        track,
        course,
        note: noteOf(actions.result, t),
        goal: goal.form,
        retry: () => void read.mutate(),
        setTrack,
        setCourse,
        toggle: (deckId) => {
            const deck = read.data?.find((each) => each.deckId === deckId)
            if (deck !== undefined) actions.toggle(deck)
        },
        setGoal: goal.setGoal,
        saveGoal: goal.saveGoal,
    }
}
