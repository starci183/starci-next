import type { MarkdownBlock } from "@starci-next/ui"

/** The tone of a badge in the review screens. */
export type ReviewTone = "neutral" | "accent" | "success" | "warning" | "danger" | "muted"

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

/** One grade button: its words, the next interval and its shortcut. */
export type ReviewGradeButton = {
    readonly grade: "AGAIN" | "HARD" | "GOOD" | "EASY"
    readonly label: string
    readonly interval: string
    readonly key: string
}

/** One cloze check of the front. */
export type ReviewClozeView = {
    readonly n: number
    readonly label: string
    readonly choices: ReadonlyArray<string>
    readonly picked: string | undefined
    /** `undefined` before the check answers. */
    readonly result: "correct" | "wrong" | undefined
}

/** One part of the revealed answer. */
export type ReviewAnswerPart = {
    readonly id: string
    readonly title: string | undefined
    readonly blocks: ReadonlyArray<MarkdownBlock>
}

/** The revealed answer with the grade buttons. */
export type ReviewBackView = {
    readonly parts: ReadonlyArray<ReviewAnswerPart>
    readonly grades: ReadonlyArray<ReviewGradeButton>
}

/** The item on screen. */
export type ReviewItemScreen = {
    readonly kind: "item"
    readonly isRetrieval: boolean
    readonly sourceLine: string
    readonly lessonLine: string | undefined
    readonly question: string
    readonly level: string | undefined
    readonly tags: ReadonlyArray<string>
    readonly cloze: ReadonlyArray<ReviewClozeView>
    readonly note: string
    readonly isFlipping: boolean
    readonly issue: "none" | "soon" | "invalid" | "failed"
    /** The revealed answer and the buttons; undefined before the flip. */
    readonly back: ReviewBackView | undefined
    readonly isGrading: boolean
    readonly isGradeFailed: boolean
}

/** The end of the session. */
export type ReviewSummaryScreen = {
    readonly kind: "summary"
    readonly reviewed: string
    readonly recall: string
    readonly goal: string | undefined
    readonly remaining: string
    readonly isAllDone: boolean
}

/** What the session body shows once it has data. */
export type ReviewSessionScreen = { readonly kind: "locked" } | ReviewItemScreen | ReviewSummaryScreen

/** The fixed words of the session. */
export type ReviewSessionLabels = {
    readonly pageTitle: string
    readonly progressLabel: string
    readonly progressText: string
    readonly noteLabel: string
    readonly notePlaceholder: string
    readonly retrievalLabel: string
    readonly retrievalPlaceholder: string
    readonly flip: string
    readonly revealRetrieval: string
    readonly retrievalSoon: string
    readonly retrievalSoonNote: string
    readonly skip: string
    readonly clozeTitle: string
    readonly clozeCorrect: string
    readonly clozeWrong: string
    readonly rateQuestion: string
    readonly rateGroup: string
    readonly shortcuts: string
    readonly saveFailedTitle: string
    readonly saveFailedBody: string
    readonly retry: string
    readonly lockedTitle: string
    readonly lockedBody: string
    readonly upsell: string
    readonly answerError: string
    readonly diagram: string
    readonly diagramError: string
    readonly summaryTitle: string
    readonly summaryReviewed: string
    readonly summaryRecall: string
    readonly summaryGoal: string
    readonly summaryAllDone: string
    readonly summaryBack: string
    readonly summaryHub: string
    readonly emptyBack: string
}

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
