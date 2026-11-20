"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import {
    useMutateAddReviewDeckSwr,
    useMutateRemoveReviewDeckSwr,
    useQueryReviewDeckSwr,
    useQueryReviewTodaySwr,
} from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { navigation } from "@starci-next/i18n/navigation"
import { useTrackTitle } from "./useTrackTitle"
import { APP_ROUTES } from "@/modules/routes"
import type { DataSlot, SlotLabels } from "@/modules/types"

/** One sample card: only its question. */
export type ReviewDeckSample = { readonly id: string; readonly question: string; readonly kind: string }

/** The deck as the page draws it. */
export type ReviewDeckView = {
    readonly title: string
    readonly meta: string
    readonly description: string
    readonly isAdded: boolean
    readonly figures: ReadonlyArray<{ readonly id: string; readonly term: string; readonly value: string }>
    readonly samples: ReadonlyArray<ReviewDeckSample>
}

/** The words of the deck page. */
export type ReviewDeckLabels = Readonly<
    Record<
        | "breadcrumbs"
        | "root"
        | "decks"
        | "previewTitle"
        | "previewNote"
        | "removeTitle"
        | "removeText"
        | "remove"
        | "errorText"
        | "failed",
        string
    >
>

/** The deck screen: the deck, its commands and where a change stands. */
export type ReviewDeckScreen = {
    readonly props: {
        readonly slot: DataSlot<ReviewDeckView>
        readonly placeholder: ReviewDeckView
        readonly slotLabels: SlotLabels
        readonly labels: ReviewDeckLabels
        readonly primary:
            | { readonly label: string; readonly href: string }
            | { readonly label: string; readonly isPending: true }
            | { readonly label: string; readonly add: true }
        readonly rootHref: string
        readonly decksHref: string
        readonly isRemoving: boolean
        readonly isFailed: boolean
    }
    readonly on: { readonly retry: () => void; readonly add: () => void; readonly remove: () => void }
}

/** The same-shape deck the skeleton draws while the first read runs. */
export const REVIEW_DECK_PLACEHOLDER: ReviewDeckView = {
    title: "xxxxxxxxxxxx",
    meta: "xx · xxxxxx · xxxxxx",
    description: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    isAdded: false,
    figures: [1, 2, 3].map((n) => ({ id: `placeholder-${n}`, term: "", value: "xx" })),
    samples: [1, 2, 3].map((n) => ({ id: `placeholder-${n}`, question: "xxxxxxxxxxxxxxxxxxxxxxxx", kind: "xxxxxx" })),
}

/** The connected deck screen: reads one deck, adds or removes it and reads again. */
export const useReviewDeckScreen = (deckId: string): ReviewDeckScreen => {
    const locale = useLocale()
    const t = useTranslations("app.review.deck")
    const word = useTranslations("app.review.difficulty")
    const trackTitle = useTrackTitle()
    const router = navigation.useRouter()
    const slotLabels = useSlotLabels()(t("notFound"))
    const read = useQueryReviewDeckSwr(deckId, locale)
    const today = useQueryReviewTodaySwr(locale)
    const adder = useMutateAddReviewDeckSwr()
    const remover = useMutateRemoveReviewDeckSwr()
    const [isFailed, setFailed] = useState(false)
    useDocumentTitle(read.data?.deck.title)
    const difficulties: Readonly<Record<string, string>> = {
        easy: word("easy"),
        medium: word("medium"),
        hard: word("hard"),
    }
    const viewOf = (data: NonNullable<typeof read.data>): ReviewDeckView => {
        const deck = data.deck
        const progress = data.progress
        return {
            title: deck.title,
            meta: [
                t("cards", { count: deck.cardCount }),
                difficulties[deck.difficulty.toLowerCase()] ?? deck.difficulty,
                ...deck.track.map(trackTitle),
                deck.course.replace(/^\d+-/, "").replaceAll("-", " "),
            ].join(" · "),
            description: deck.description,
            isAdded: deck.added,
            figures: deck.added
                ? [
                      { id: "total", term: t("figureTotal"), value: `${progress.total}` },
                      { id: "learned", term: t("figureLearned"), value: `${progress.learned}` },
                      { id: "good", term: t("figureGood"), value: `${progress.remembering}` },
                      { id: "again", term: t("figureAgain"), value: `${progress.needsReview}` },
                  ]
                : [
                      { id: "total", term: t("figureTotal"), value: `${deck.cardCount}` },
                      { id: "learned", term: t("figureLearned"), value: `${progress.learned}` },
                      { id: "perDay", term: t("figurePerDay"), value: `${data.estimatedNewPerDay}` },
                  ],
            samples: data.sampleCards.map((card) => ({
                id: card.cardId,
                question: card.question,
                kind: card.kind === "cloze" ? t("kindCloze") : t("kindDirect"),
            })),
        }
    }
    const isAdded = read.data?.deck.added === true
    const settle = (work: Promise<unknown>): void => {
        setFailed(false)
        void work.then(() => Promise.all([read.mutate(), today.mutate()])).catch(() => setFailed(true))
    }
    let primary: ReviewDeckScreen["props"]["primary"] = { label: t("add"), add: true }
    if (adder.isMutating) primary = { label: t("adding"), isPending: true }
    else if (isAdded) primary = { label: t("review"), href: APP_ROUTES.reviewSession }
    return {
        props: {
            slot: mapSlot(slotOfSwr(read), viewOf),
            placeholder: REVIEW_DECK_PLACEHOLDER,
            slotLabels: { ...slotLabels, error: t("notFound"), retry: t("backToDecks") },
            labels: {
                breadcrumbs: t("breadcrumbs"),
                root: t("root"),
                decks: t("decks"),
                previewTitle: t("previewTitle"),
                previewNote: t("previewNote"),
                removeTitle: t("removeTitle"),
                removeText: t("removeText"),
                remove: t("remove"),
                errorText: t("errorText"),
                failed: t("failed"),
            },
            primary,
            rootHref: APP_ROUTES.review,
            decksHref: APP_ROUTES.reviewDecks,
            isRemoving: remover.isMutating,
            isFailed,
        },
        on: {
            retry: () => router.push(APP_ROUTES.reviewDecks),
            add: () => settle(adder.trigger({ deckId })),
            remove: () => settle(remover.trigger({ deckId })),
        },
    }
}
