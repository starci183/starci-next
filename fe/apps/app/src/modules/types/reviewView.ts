import type { ReviewItemScreen, ReviewSummaryScreen, ReviewTone } from "@starci-next/ui"

/** One row of today's queue as it is drawn. */
export type ReviewTodayRow = {
    readonly id: string
    readonly title: string
    readonly meta: string
    readonly badge: string
    readonly badgeTone: ReviewTone
    readonly isLocked: boolean
}

/** Today's review as it is drawn: every word is already resolved. */
export type ReviewTodayScreen = {
    /** `ready` has items to review, `empty` has nothing due, `done` met the goal and has nothing left. */
    readonly state: "ready" | "empty" | "done"
    readonly goalPercent: number
    readonly goalText: string
    readonly dueLine: string
    readonly newLine: string | undefined
    readonly splitCards: string
    readonly splitRetrieval: string
    readonly doneBody: string
    readonly lockedBody: string | undefined
    readonly canStartNew: boolean
    readonly rows: ReadonlyArray<ReviewTodayRow>
    readonly sourceDeck: string
    readonly sourceLesson: string
}

/** The fixed words of today's screen. */
export type ReviewTodayLabels = {
    readonly pageTitle: string
    readonly intro: string
    readonly goalLabel: string
    readonly dueTitle: string
    readonly start: string
    readonly startNew: string
    readonly decks: string
    readonly emptyTitle: string
    readonly emptyBody: string
    readonly emptyEssentials: string
    readonly doneTitle: string
    readonly lockedTitle: string
    readonly upsell: string
    readonly upsellNote: string
    readonly queueTitle: string
    readonly sourcesTitle: string
    readonly streakNote: string
    readonly hubLink: string
}

/** What the session body shows once it has data. */
export type ReviewSessionScreen = { readonly kind: "locked" } | ReviewItemScreen | ReviewSummaryScreen

/** One deck card as it is drawn. */
export type ReviewDeckCard = {
    readonly id: string
    readonly title: string
    readonly description: string
    readonly difficulty: string
    readonly cards: string
    readonly free: string
    readonly isPartlyLocked: boolean
    readonly isAdded: boolean
    readonly isPending: boolean
}

/** The fixed words of the decks screen. */
export type ReviewDecksLabels = {
    readonly pageTitle: string
    readonly intro: string
    readonly asideTitle: string
    readonly filterLabel: string
    readonly courseLabel: string
    readonly partlyLocked: string
    readonly add: string
    readonly added: string
    readonly remove: string
    readonly failed: string
    readonly goalTitle: string
    readonly goalLabel: string
    readonly goalHelp: string
    readonly goalSave: string
    readonly goalSaved: string
    readonly goalInvalid: string
    readonly back: string
}

/** What the goal form shows. */
export type ReviewGoalForm = {
    readonly value: number
    readonly min: number
    readonly max: number
    readonly state: "idle" | "saved" | "invalid" | "failed"
    readonly isSaving: boolean
}

/** A note about the last add or remove of a deck. */
export type ReviewDeckNote = { readonly tone: "affirmative" | "negative"; readonly text: string }

/** One option of a filter. */
export type ReviewFilterOption = { readonly id: string; readonly label: string }
