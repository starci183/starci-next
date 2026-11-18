"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { useReviewDeckActions } from "@/hooks/review"
import { mapSlot, settledListSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import { useQueryReviewDecksSwr, useQueryReviewTodaySwr } from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, reviewDeckPath } from "@/modules/routes"
import type { DataSlot, ReviewDeckView, SlotLabels } from "@/modules/types"

/** The two state chips of the list. */
export type ReviewDecksFilter = "all" | "added" | "new"

/** One deck as the list draws it. */
export type ReviewDeckRow = {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly facts: string
    readonly tracks: ReadonlyArray<string>
    readonly isAdded: boolean
    readonly isPending: boolean
    readonly href: string
}

/** The one note after an add, with the way to undo it. */
export type ReviewDecksNote = { readonly text: string; readonly title: string; readonly isFailed: boolean }

/** The words of the decks screen. */
export type ReviewDecksLabels = Readonly<
    Record<
        | "breadcrumbs"
        | "root"
        | "listTitle"
        | "filterLabel"
        | "trackLabel"
        | "add"
        | "added"
        | "remove"
        | "undo"
        | "emptyAdded"
        | "emptyAddedText"
        | "emptyAddedAction"
        | "errorText"
        | "noMatch",
        string
    >
>

/** The decks screen: header, chips, the list and the note of the last change. */
export type ReviewDecksScreen = {
    readonly props: {
        readonly header: { readonly title: string; readonly meta: string; readonly rootHref: string }
        readonly slot: DataSlot<ReadonlyArray<ReviewDeckRow>>
        readonly placeholder: ReadonlyArray<ReviewDeckRow>
        readonly slotLabels: SlotLabels
        readonly labels: ReviewDecksLabels
        readonly filter: ReviewDecksFilter
        readonly filterOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>
        readonly track: string
        readonly trackOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>
        readonly note: ReviewDecksNote | null
        readonly decksHref: string
    }
    readonly on: {
        readonly retry: () => void
        readonly setFilter: (value: string) => void
        readonly setTrack: (value: string) => void
        readonly toggle: (id: string) => void
        readonly undo: () => void
        readonly showAll: () => void
    }
}

/** The same-shape list the skeleton draws while the first read runs. */
export const REVIEW_DECKS_PLACEHOLDER: ReadonlyArray<ReviewDeckRow> = [1, 2, 3, 4].map((n) => ({
    id: `placeholder-${n}`,
    title: "xxxxxxxxxxxx",
    description: "xxxxxxxxxxxxxxxxxxxxxxxx",
    facts: "xx",
    tracks: ["xxxx"],
    isAdded: false,
    isPending: false,
    href: `/${n}`,
}))

/** The state chips, in order. */
const FILTERS: ReadonlyArray<ReviewDecksFilter> = ["all", "added", "new"]

/** The chip a value names; anything else keeps every deck. */
const filterOf = (value: string): ReviewDecksFilter => FILTERS.find((each) => each === value) ?? "all"

/** The connected decks screen: reads the decks, filters in the browser and adds or removes a deck with an undo. */
export const useReviewDecksScreen = (): ReviewDecksScreen => {
    const locale = useLocale()
    const t = useTranslations("app.review.decks")
    const word = useTranslations("app.review.difficulty")
    const slotLabels = useSlotLabels()(t("emptyTitle"))
    const read = useQueryReviewDecksSwr(locale)
    const today = useQueryReviewTodaySwr(locale)
    const actions = useReviewDeckActions()
    const [filter, setFilter] = useState<ReviewDecksFilter>("all")
    const [track, setTrack] = useState("all")
    const [last, setLast] = useState<ReviewDeckView | undefined>(undefined)
    useDocumentTitle(t("pageTitle"))
    const decks = read.data ?? []
    const difficulties: Readonly<Record<string, string>> = {
        easy: word("easy"),
        medium: word("medium"),
        hard: word("hard"),
    }
    const tracks = [...new Set(decks.flatMap((deck) => deck.track))].toSorted((a, b) => a.localeCompare(b))
    const added = decks.filter((deck) => deck.added)
    const countOf = (each: ReviewDecksFilter): number =>
        each === "all" ? decks.length : each === "added" ? added.length : decks.length - added.length
    const shown = decks.filter(
        (deck) =>
            (filter === "all" || (filter === "added") === deck.added) &&
            (track === "all" || deck.track.includes(track)),
    )
    const rowOf = (deck: ReviewDeckView): ReviewDeckRow => ({
        id: deck.deckId,
        title: deck.title,
        description: deck.description,
        facts: [
            t("cards", { count: deck.cardCount }),
            difficulties[deck.difficulty.toLowerCase()] ?? deck.difficulty,
        ].join(" · "),
        tracks: deck.track,
        isAdded: deck.added,
        isPending: actions.pendingId === deck.deckId,
        href: reviewDeckPath(deck.deckId),
    })
    const result = actions.result
    let note: ReviewDecksNote | null = null
    if (result?.kind === "failed") note = { title: t("failed"), text: "", isFailed: true }
    else if (result?.kind === "added" && last !== undefined) {
        note = {
            title: t("addedTitle", { title: last.title }),
            text: t("addedText", { count: result.count }),
            isFailed: false,
        }
    }
    return {
        props: {
            header: {
                title: t("pageTitle"),
                meta: t("meta", { total: decks.length, added: added.length, goal: today.data?.goal.daily ?? 10 }),
                rootHref: APP_ROUTES.review,
            },
            slot: settledListSlot(mapSlot(slotOfSwr(read), () => shown.map(rowOf))),
            placeholder: REVIEW_DECKS_PLACEHOLDER,
            slotLabels: { ...slotLabels, error: t("errorTitle") },
            labels: {
                breadcrumbs: t("breadcrumbs"),
                root: t("root"),
                listTitle: t("listTitle"),
                filterLabel: t("filterLabel"),
                trackLabel: t("trackLabel"),
                add: t("add"),
                added: t("added"),
                remove: t("remove"),
                undo: t("undo"),
                emptyAdded: t("emptyAdded"),
                emptyAddedText: t("emptyAddedText"),
                emptyAddedAction: t("emptyAddedAction"),
                errorText: t("errorText"),
                noMatch: t("noMatch"),
            },
            filter,
            filterOptions: FILTERS.map((each) => ({
                value: each,
                label: t(`filters.${each}`, { count: countOf(each) }),
            })),
            track,
            trackOptions: [
                { value: "all", label: t("allTracks") },
                ...tracks.map((each) => ({ value: each, label: each })),
            ],
            note,
            decksHref: APP_ROUTES.reviewDecks,
        },
        on: {
            retry: () => void read.mutate(),
            setFilter: (value) => setFilter(filterOf(value)),
            setTrack,
            toggle: (id) => {
                const deck = decks.find((each) => each.deckId === id)
                if (deck === undefined) return
                setLast(deck)
                actions.toggle(deck)
            },
            undo: () => {
                if (last !== undefined) actions.toggle({ ...last, added: true })
            },
            showAll: () => setFilter("all"),
        },
    }
}
