/** The four self-grades of a revealed review item, as the door names them. */
export type ReviewGrade = "AGAIN" | "HARD" | "GOOD" | "EASY"

/** One item of the queue of the day. */
export type ReviewQueueItemView = {
    readonly itemId: string
    /** `flashcard` or `retrieval`. */
    readonly source: string
    readonly status: string
    readonly deckTitle: string | null
    readonly lessonTitle: string | null
    readonly level: string | null
    /** True when the item needs Premium and the reader holds none. */
    readonly locked: boolean
    readonly dueOn: string
}

/** The review of today: counts, the goal and the items (due first, then new, then locked). */
export type ReviewTodayView = {
    readonly date: string
    readonly due: number
    readonly overdue: number
    readonly newAvailable: number
    readonly lockedCount: number
    readonly goal: { readonly daily: number; readonly done: number }
    readonly items: ReadonlyArray<ReviewQueueItemView>
}

/** The front of one item: the question and the cloze checks, never the answer. */
export type RecallItemView = {
    readonly itemId: string
    readonly source: string
    readonly question: string
    readonly level: string | null
    readonly tags: ReadonlyArray<string>
    readonly langs: ReadonlyArray<string>
    readonly cloze: ReadonlyArray<{ readonly n: number; readonly choices: ReadonlyArray<string> }>
    readonly lessonId: string | null
    readonly activityId: string | null
    readonly deckTitle: string | null
    readonly lessonTitle: string | null
    readonly revision: number
    readonly flipped: boolean
}

/** The days until the next review for each grade. */
export type ReviewIntervalsView = {
    readonly again: number
    readonly hard: number
    readonly good: number
    readonly easy: number
}

/** The revealed answer of an item with the next interval of each grade. */
export type ReviewFlipView = {
    readonly itemId: string
    readonly answer: string
    readonly revision: number
    readonly intervals: ReviewIntervalsView
}

/** What a stored grade answers. */
export type ReviewGradeResultView = {
    readonly itemId: string
    readonly status: string
    readonly step: number
    readonly dueOn: string
    readonly remainingToday: number
    readonly goal: { readonly daily: number; readonly done: number }
}

/** One flashcard deck. */
export type ReviewDeckView = {
    readonly deckId: string
    readonly course: string
    readonly title: string
    readonly description: string
    readonly difficulty: string
    readonly cardCount: number
    readonly freeCardCount: number
    readonly added: boolean
    readonly track: ReadonlyArray<string>
}
