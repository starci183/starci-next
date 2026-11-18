"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import { mapSlot, slotOfSwr, useSlotLabels } from "@/hooks/slot"
import {
    useMutateSetReviewGoalSwr,
    useQueryReviewDecksSwr,
    useQueryReviewStatsSwr,
    useQueryReviewTodaySwr,
    useQueryStreakSwr,
} from "@/hooks/swr"
import { useDocumentTitle } from "@/hooks/title"
import { APP_ROUTES, reviewDeckPath } from "@/modules/routes"
import type { DataSlot, ReviewQueueItemView, SlotLabels } from "@/modules/types"

/** What the day looks like: cards to review, the goal met, nothing due, or no deck added yet. */
export type ReviewHubState = "due" | "done" | "nothing" | "first"

/** One number of the strip under the header. */
export type ReviewHubFigure = { readonly id: string; readonly term: string; readonly value: string }

/** One card of the list of the next cards. */
export type ReviewHubRow = {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly badge: string
    readonly tone: "warning" | "accent" | "neutral"
}

/** One deck of the learner in the rail. */
export type ReviewHubDeck = {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly href: string
}

/** The day as the hub draws it. */
export type ReviewHubView = {
    readonly state: ReviewHubState
    readonly figures: ReadonlyArray<ReviewHubFigure>
    readonly rows: ReadonlyArray<ReviewHubRow>
    readonly total: number
    readonly moreLine: string
    readonly goalDaily: number
    readonly goalLine: string
    readonly streakLine: string
    readonly decks: ReadonlyArray<ReviewHubDeck>
    readonly bars: ReadonlyArray<{
        readonly id: string
        readonly label: string
        readonly value: number
        readonly valueLabel: string
    }>
}

/** The header: title, facts line and the one command. */
export type ReviewHubHeader = {
    readonly title: string
    readonly meta: string
    readonly primary: { readonly label: string; readonly href: string; readonly intent: "commit" | "neutral" } | null
}

/** The words of the hub. */
export type ReviewHubLabels = Readonly<
    Record<
        | "figuresLabel"
        | "listTitle"
        | "listLabel"
        | "doneTitle"
        | "doneBody"
        | "nothingTitle"
        | "nothingBody"
        | "nothingAction"
        | "recallTitle"
        | "recallLabel"
        | "recallNote"
        | "recallEmpty"
        | "goalTitle"
        | "goalChange"
        | "decksTitle"
        | "decksManage"
        | "decksEmpty"
        | "howTitle"
        | "howBody"
        | "goalFirstTitle"
        | "goalFirstNote"
        | "dialogTitle"
        | "dialogBody"
        | "dialogCancel"
        | "dialogSave"
        | "dialogOther"
        | "dialogOtherLabel"
        | "goalOptionsLabel"
        | "errorText"
        | "saveFailed"
        | "recallError",
        string
    >
>

/** The hub screen: the day, its header, the goal dialog and its commands. */
export type ReviewHubScreen = {
    readonly props: {
        readonly header: ReviewHubHeader
        readonly slot: DataSlot<ReviewHubView>
        readonly placeholder: ReviewHubView
        readonly slotLabels: SlotLabels
        readonly labels: ReviewHubLabels
        readonly goalOptions: ReadonlyArray<{ readonly value: string; readonly label: string }>
        readonly goalChoice: string
        readonly goalCustom: number
        readonly isGoalOpen: boolean
        readonly isGoalSaving: boolean
        readonly isGoalFailed: boolean
        readonly sessionHref: string
        readonly decksHref: string
    }
    readonly on: {
        readonly retry: () => void
        readonly openGoal: () => void
        readonly closeGoal: () => void
        readonly chooseGoal: (value: string) => void
        readonly setCustom: (value: number) => void
        readonly saveGoal: () => void
        readonly quickGoal: (value: string) => void
    }
}

/** The same-shape day the skeleton draws while the first read runs. */
export const REVIEW_HUB_PLACEHOLDER: ReviewHubView = {
    state: "due",
    figures: [1, 2, 3].map((n) => ({ id: `placeholder-${n}`, term: "xxxxxxxx", value: "xx" })),
    rows: [1, 2, 3].map((n) => ({
        id: `placeholder-${n}`,
        title: "xxxxxxxxxxxxxxxxxxxxxxxx",
        description: "xxxxxxxxxxxxxxxx",
        badge: "xxxxxx",
        tone: "neutral",
    })),
    total: 3,
    moreLine: "xxxxxxxx",
    goalDaily: 10,
    goalLine: "xxxxxxxx",
    streakLine: "xxxxxxxxxxxxxxxx",
    decks: [1, 2].map((n) => ({ id: `placeholder-${n}`, title: "xxxxxxxxxx", description: "xx", href: "/" })),
    bars: [1, 2, 3, 4].map((n) => ({ id: `placeholder-${n}`, label: "xxxx", value: 50, valueLabel: "xx%" })),
}

/** The goal values the dialog and the first-visit chips offer. */
const GOALS: ReadonlyArray<number> = [5, 10, 20, 30]

/** The days a card is late. */
const daysLateOf = (dueOn: string, today: string): number =>
    Math.max(1, Math.round((Date.parse(today) - Date.parse(dueOn)) / 86_400_000))

/** The connected review hub: reads today, the stats, the decks and the streak and words the day. */
export const useReviewHubScreen = (): ReviewHubScreen => {
    const locale = useLocale()
    const t = useTranslations("app.review.hub")
    const slotLabels = useSlotLabels()(t("nothingTitle"))
    const read = useQueryReviewTodaySwr(locale)
    const stats = useQueryReviewStatsSwr()
    const decks = useQueryReviewDecksSwr(locale)
    const streak = useQueryStreakSwr()
    const writer = useMutateSetReviewGoalSwr()
    const [isGoalOpen, setGoalOpen] = useState(false)
    const [choice, setChoice] = useState("10")
    const [custom, setCustom] = useState(10)
    const [isFailed, setFailed] = useState(false)
    useDocumentTitle(t("pageTitle"))
    const today = read.data
    const mine = (decks.data ?? []).filter((deck) => deck.added)
    const current = streak.data?.current ?? 0
    const viewOf = (data: NonNullable<typeof today>): ReviewHubView => {
        const isDone = data.goal.done >= data.goal.daily && data.due === 0
        let state: ReviewHubState = "due"
        if (data.items.length === 0 && mine.length === 0 && decks.data !== undefined) state = "first"
        else if (data.items.length === 0) state = isDone ? "done" : "nothing"
        const rowOf = (item: ReviewQueueItemView): ReviewHubRow => {
            const late = item.status !== "new" && item.dueOn < data.date
            let badge = t("badgeDue")
            if (item.status === "new") badge = t("badgeNew")
            else if (late) badge = t("badgeLate", { days: daysLateOf(item.dueOn, data.date) })
            return {
                id: item.itemId,
                title: item.question,
                description:
                    item.source === "retrieval"
                        ? t("fromLesson", { title: item.lessonTitle ?? "" })
                        : t("fromDeck", { title: item.deckTitle ?? "" }),
                badge,
                tone: late ? "warning" : item.status === "new" ? "accent" : "neutral",
            }
        }
        return {
            state,
            figures: [
                { id: "due", term: t("figureDue"), value: `${data.due}` },
                { id: "new", term: t("figureNew"), value: `${data.newAvailable}` },
                { id: "done", term: t("figureDone"), value: `${data.goal.done}/${data.goal.daily}` },
            ],
            rows: data.items.slice(0, 5).map(rowOf),
            total: data.items.length,
            moreLine: t("listMore", { count: data.items.length }),
            goalDaily: data.goal.daily,
            goalLine: t("goalLine", { done: data.goal.done, daily: data.goal.daily }),
            streakLine: t("streakLine", { days: current }),
            decks: mine.map((deck) => ({
                id: deck.deckId,
                title: deck.title,
                description: t("deckCards", { count: deck.cardCount }),
                href: reviewDeckPath(deck.deckId),
            })),
            bars: (stats.data?.recallRateByReview ?? []).map((each) => ({
                id: `n-${each.n}`,
                label: t("recallStep", { n: each.n }),
                value: Math.round(each.rate * 100),
                valueLabel: `${Math.round(each.rate * 100)}%`,
            })),
        }
    }
    const slot = mapSlot(slotOfSwr(read), viewOf)
    const view = "items" in slot ? slot.items : undefined
    const header = ((): ReviewHubHeader => {
        const title = t("pageTitle")
        if (view === undefined || today === undefined) return { title, meta: t("metaFree"), primary: null }
        const facts = [
            view.state === "first"
                ? t("metaNoDecks")
                : view.state === "due"
                  ? t("metaDue", { due: today.due, overdue: today.overdue })
                  : view.state === "done"
                    ? t("metaDone", { done: today.goal.done, daily: today.goal.daily })
                    : t("metaNothing"),
            view.state === "due" || view.state === "first" ? t("metaGoal", { daily: today.goal.daily }) : "",
            view.state === "first" ? "" : t("metaStreak", { days: current }),
            t("metaFree"),
        ].filter((part) => part !== "")
        const meta = facts.join(" · ")
        if (view.state === "due")
            return {
                title,
                meta,
                primary: {
                    label: t("start", { count: today.items.length }),
                    href: APP_ROUTES.reviewSession,
                    intent: "commit",
                },
            }
        if (view.state === "done")
            return {
                title,
                meta,
                primary:
                    today.newAvailable > 0
                        ? {
                              label: t("startNew", { count: Math.min(5, today.newAvailable) }),
                              href: APP_ROUTES.reviewSession,
                              intent: "neutral",
                          }
                        : null,
            }
        return {
            title,
            meta,
            primary: {
                label: view.state === "first" ? t("pickFirst") : t("pickDeck"),
                href: APP_ROUTES.reviewDecks,
                intent: "commit",
            },
        }
    })()
    const save = (value: number): void => {
        setFailed(false)
        void writer
            .trigger({ daily: value })
            .then(() => {
                setGoalOpen(false)
                return read.mutate()
            })
            .catch(() => setFailed(true))
    }
    const labels: ReviewHubLabels = {
        figuresLabel: t("figuresLabel"),
        listTitle: t("listTitle"),
        listLabel: t("listLabel"),
        doneTitle: t("doneTitle"),
        doneBody: t("doneBody"),
        nothingTitle: t("nothingTitle"),
        nothingBody: t("nothingBody"),
        nothingAction: t("nothingAction"),
        recallTitle: t("recallTitle"),
        recallLabel: t("recallLabel"),
        recallNote: t("recallNote"),
        recallEmpty: t("recallEmpty"),
        goalTitle: t("goalTitle"),
        goalChange: t("goalChange"),
        decksTitle: t("decksTitle"),
        decksManage: t("decksManage"),
        decksEmpty: t("decksEmpty"),
        howTitle: t("howTitle"),
        howBody: t("howBody"),
        goalFirstTitle: t("goalFirstTitle"),
        goalFirstNote: t("goalFirstNote"),
        dialogTitle: t("dialogTitle"),
        dialogBody: t("dialogBody"),
        dialogCancel: t("dialogCancel"),
        dialogSave: t("dialogSave"),
        dialogOther: t("dialogOther"),
        dialogOtherLabel: t("dialogOtherLabel"),
        goalOptionsLabel: t("goalOptionsLabel"),
        errorText: t("errorText"),
        saveFailed: t("saveFailed"),
        recallError: t("recallError"),
    }
    return {
        props: {
            header,
            slot,
            placeholder: REVIEW_HUB_PLACEHOLDER,
            slotLabels: { ...slotLabels, error: t("errorTitle") },
            labels,
            goalOptions: [
                ...GOALS.map((value) => ({ value: `${value}`, label: t("goalOption", { count: value }) })),
                { value: "other", label: t("dialogOther") },
            ],
            goalChoice: choice,
            goalCustom: custom,
            isGoalOpen,
            isGoalSaving: writer.isMutating,
            isGoalFailed: isFailed,
            sessionHref: APP_ROUTES.reviewSession,
            decksHref: APP_ROUTES.reviewDecks,
        },
        on: {
            retry: () => void read.mutate(),
            openGoal: () => {
                setChoice(GOALS.includes(today?.goal.daily ?? 10) ? `${today?.goal.daily ?? 10}` : "other")
                setCustom(today?.goal.daily ?? 10)
                setFailed(false)
                setGoalOpen(true)
            },
            closeGoal: () => setGoalOpen(false),
            chooseGoal: setChoice,
            setCustom,
            saveGoal: () => save(choice === "other" ? custom : Number(choice)),
            quickGoal: (value) => save(Number(value)),
        },
    }
}
