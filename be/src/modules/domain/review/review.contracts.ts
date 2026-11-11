/** The locales of the review content. */
export type ReviewLocale = "vi" | "en"

/** The locales every deck is written in. */
export const REVIEW_LOCALES: ReadonlyArray<ReviewLocale> = ["vi", "en"]

/** The four self-grades: again, hard, good, easy. */
export const REVIEW_GRADES = ["again", "hard", "good", "easy"] as const

/** A self-grade. */
export type ReviewGrade = (typeof REVIEW_GRADES)[number]

/** What an item is: a flashcard of a deck, or a retrieval question of a finished Essentials lesson. */
export type ReviewSource = "flashcard" | "retrieval"

/** Where an item stands for one learner. */
export type ReviewStatus = "new" | "learning" | "review" | "done" | "suspended"

/** How an item came to the learner: the deck was added, a lesson completed, or an outcome track. */
export type ReviewAddedBy = "deck" | "lesson" | "track"

/** The levels a card is written for. */
export const REVIEW_LEVELS = ["junior", "middle", "senior", "staff"] as const

/** The level of a card. */
export type ReviewLevel = (typeof REVIEW_LEVELS)[number]

/** The fewest items a day a learner may set as the goal. */
export const REVIEW_GOAL_MIN = 5

/** The most items a day a learner may set as the goal. */
export const REVIEW_GOAL_MAX = 50

/** The goal of a learner who set none. */
export const REVIEW_GOAL_DEFAULT = 10

/** The retrieval days the teacher authors. */
export const RETRIEVAL_AFTER_DAYS: ReadonlyArray<number> = [1, 7, 21]

/** One hidden term of a card and the wrong terms it is offered among. */
export interface ReviewCloze {
    /** The number in `{{cN::term::distractors}}`. */
    readonly n: number
    /** The hidden term. */
    readonly term: string
    /** The wrong choices offered beside the term. */
    readonly distractors: ReadonlyArray<string>
}

/** The public front of a card in one locale. */
export interface ReviewCardFront {
    /** The question. */
    readonly question: string
    /** The tags. */
    readonly tags: ReadonlyArray<string>
}

/** The hidden back of a card in one locale. */
export interface ReviewCardBack {
    /** The answer markdown as authored, with its cloze markers. */
    readonly answer: string
    /** The cloze terms of the answer. */
    readonly clozes: ReadonlyArray<ReviewCloze>
}

/** A card of a deck draft. */
export interface ReviewCardDraft {
    /** The item id, `card:<course>/<deck folder>/<n>`. */
    readonly itemId: string
    /** The position in the deck. */
    readonly sortIndex: number
    /** Whether the card needs Premium. */
    readonly isPremium: boolean
    /** The level. */
    readonly level: ReviewLevel
    /** The code language, or null. */
    readonly langs: string | null
    /** The front by locale. */
    readonly front: Readonly<Record<ReviewLocale, ReviewCardFront>>
    /** The back by locale. */
    readonly back: Readonly<Record<ReviewLocale, ReviewCardBack>>
}

/** A deck folder read, parsed and validated, ready to store. */
export interface ReviewDeckDraft {
    /** The deck id, `<course>/<deck folder>`. */
    readonly deckId: string
    /** The course folder. */
    readonly course: string
    /** The position in the course. */
    readonly sortIndex: number
    /** The difficulty the teacher wrote. */
    readonly difficulty: string
    /** The titles by locale. */
    readonly titles: Readonly<Record<ReviewLocale, string>>
    /** The descriptions by locale. */
    readonly descriptions: Readonly<Record<ReviewLocale, string>>
    /** The lesson modules the deck belongs to, as bare slugs. */
    readonly moduleRefs: ReadonlyArray<string>
    /** The outcome tracks that use the deck. */
    readonly tracks: ReadonlyArray<string>
    /** The cards in order. */
    readonly cards: ReadonlyArray<ReviewCardDraft>
    /** The SHA-256 of every source file by posix path. */
    readonly sourceHashes: Readonly<Record<string, string>>
    /** The SHA-256 over the sorted path and hash lines of every source file. */
    readonly contentHash: string
}

/** One problem found while importing a deck, with the source file and field that hold it. */
export interface ReviewIssue {
    /** The file of the deck folder, posix and relative. */
    readonly path: string
    /** The field inside the file, or an empty text for the file itself. */
    readonly field: string
    /** What is wrong, in words for the author. */
    readonly message: string
}

/** One file read from a deck folder: its text and the hash of its raw bytes. */
export interface ReviewSourceFile {
    /** The posix path relative to the deck folder. */
    readonly path: string
    /** The decoded text. */
    readonly text: string
    /** The lowercase hex SHA-256 of the raw bytes. */
    readonly sha256: string
}

/** A deck folder found in a checkout. */
export interface ReviewSourceDeck {
    /** The deck id, `<course>/<deck folder>`. */
    readonly deckId: string
    /** The course folder. */
    readonly course: string
    /** The deck folder. */
    readonly folder: string
}

/** The outcome of reading a deck folder: a draft, or the issues that block it. */
export interface ReviewDeckDraftResult {
    /** The draft, when no issue blocks it. */
    readonly draft: ReviewDeckDraft | null
    /** Every issue found, in file order. */
    readonly issues: ReadonlyArray<ReviewIssue>
}

/** What the import asks of one checkout. */
export interface ImportReviewDecksParams {
    /** The checkout of starci-lab/data. */
    readonly directory: string
    /** The label of the source ref; it becomes the version of every deck imported. */
    readonly ref: string
    /** The deck ids to import, separated by commas; an empty text imports every deck. */
    readonly only: string
}

/** What happened to one deck. */
export type ReviewImportStatus = "created" | "unchanged" | "refused" | "invalid"

/** The counts, version and hash the import prints for one deck; it never holds an answer. */
export interface ReviewImportReport {
    /** The deck id. */
    readonly deckId: string
    /** The version: the source ref. */
    readonly version: string
    /** What happened. */
    readonly status: ReviewImportStatus
    /** The content hash of the source, or an empty text when the folder could not be read. */
    readonly contentHash: string
    /** The source files read. */
    readonly files: number
    /** The cards of the deck. */
    readonly cards: number
    /** The cards that are free. */
    readonly freeCards: number
    /** The problems that blocked the deck; empty when it was stored or unchanged. */
    readonly issues: ReadonlyArray<ReviewIssue>
}

/** One item of the queue. */
export interface ReviewItemSummary {
    /** The item id. */
    readonly itemId: string
    /** Flashcard or retrieval. */
    readonly source: ReviewSource
    /** The status. */
    readonly status: ReviewStatus
    /** The deck title of a card. */
    readonly deckTitle: string | null
    /** The lesson title of a retrieval item. */
    readonly lessonTitle: string | null
    /** The level of a card; null for a retrieval item. */
    readonly level: ReviewLevel | null
    /** True when the item needs Premium and the learner holds none. */
    readonly locked: boolean
    /** The due day. */
    readonly dueOn: string
}

/** The goal and what is done today. */
export interface ReviewGoalView {
    /** The items a day the learner set. */
    readonly daily: number
    /** The items reviewed today. */
    readonly done: number
}

/** What the deck list is asked. */
export interface ReviewDecksQuery {
    /** The locale of the titles. */
    readonly locale: ReviewLocale
    /** Only the decks of this outcome track; all decks when absent. */
    readonly track?: string | null | undefined
}

/** What the statistics are asked. */
export interface ReviewStatsQuery {
    /** How many days the statistics look back; the default span when absent. */
    readonly days?: number | null | undefined
}

/** The lesson, version and activity a retrieval item asks about. */
export interface ReviewRetrievalRef {
    /** The lesson. */
    readonly lessonId: string
    /** The version of the lesson. */
    readonly version: string
    /** The activity of the lesson. */
    readonly activityId: string
}

/** The daily goal as stored. */
export interface ReviewGoalSetView {
    /** The items a day the learner set. */
    readonly daily: number
}

/** The day of one learner. */
export interface ReviewTodayView {
    /** The day (Asia/Ho_Chi_Minh). */
    readonly date: string
    /** Items due today, overdue included, that the learner can review. */
    readonly due: number
    /** The part of `due` that is before today. */
    readonly overdue: number
    /** New items offered today, up to the goal. */
    readonly newAvailable: number
    /** Items waiting that need Premium. */
    readonly lockedCount: number
    /** The goal. */
    readonly goal: ReviewGoalView
    /** The due items, then the new items offered, then the locked due items. */
    readonly items: ReadonlyArray<ReviewItemSummary>
}

/** One cloze check as the front shows it: the choices shuffled, never the term marked. */
export interface ReviewClozeChoices {
    /** The cloze number. */
    readonly n: number
    /** The term and its distractors, in an order that does not reveal the term. */
    readonly choices: ReadonlyArray<string>
}

/** The public view of an item: it holds the question and never the answer or a cloze term. */
export interface ReviewItemView {
    /** The item id. */
    readonly itemId: string
    /** Flashcard or retrieval. */
    readonly source: ReviewSource
    /** The question or retrieval prompt. */
    readonly question: string
    /** The level of a card; null for a retrieval item. */
    readonly level: ReviewLevel | null
    /** The tags. */
    readonly tags: ReadonlyArray<string>
    /** The code languages. */
    readonly langs: ReadonlyArray<string>
    /** The cloze checks. */
    readonly cloze: ReadonlyArray<ReviewClozeChoices>
    /** The lesson of a retrieval item. */
    readonly lessonId: string | null
    /** The retrieval activity. */
    readonly activityId: string | null
    /** The deck title of a card. */
    readonly deckTitle: string | null
    /** The lesson title of a retrieval item. */
    readonly lessonTitle: string | null
    /** The revision a grade of this item carries. */
    readonly revision: number
    /** Whether the answer was already revealed for this revision. */
    readonly flipped: boolean
}

/** The result of a cloze check. */
export interface ReviewClozeResult {
    /** Whether the picked choice is the hidden term. */
    readonly correct: boolean
}

/** The answer shown after a flip or a submit, with the interval each grade would give. */
export interface ReviewFlipView {
    /** The item id. */
    readonly itemId: string
    /** The revision a grade must carry. */
    readonly revision: number
    /** The answer markdown with the cloze terms revealed in bold. */
    readonly answer: string
    /** The days until the next review per grade; 0 means the end of today's session. */
    readonly intervals: Readonly<Record<"again" | "hard" | "good" | "easy", number>>
}

/** What a grade did. */
export interface ReviewGradeView {
    /** The item id. */
    readonly itemId: string
    /** The new status. */
    readonly status: ReviewStatus
    /** The new ladder step. */
    readonly step: number
    /** The day it is due again. */
    readonly dueOn: string
    /** The goal and what is done today. */
    readonly goal: ReviewGoalView
    /** Items still due today. */
    readonly remainingToday: number
}

/** One deck of the picker. */
export interface ReviewDeckView {
    /** The deck id. */
    readonly deckId: string
    /** The course folder. */
    readonly course: string
    /** The title. */
    readonly title: string
    /** The description. */
    readonly description: string
    /** The difficulty. */
    readonly difficulty: string
    /** The cards. */
    readonly cardCount: number
    /** The cards a free learner can review. */
    readonly freeCardCount: number
    /** Whether the learner added the deck. */
    readonly added: boolean
    /** The outcome tracks that use the deck. */
    readonly track: ReadonlyArray<string>
}

/** What adding a deck did. */
export interface ReviewDeckAddedView {
    /** The deck id. */
    readonly deckId: string
    /** Always true. */
    readonly added: true
    /** The cards that joined the learner. */
    readonly newCards: number
}

/** What removing a deck did. */
export interface ReviewDeckRemovedView {
    /** The deck id. */
    readonly deckId: string
    /** Always false. */
    readonly added: false
    /** The items suspended. */
    readonly suspended: number
}

/** The recall rate of the n-th review of items. */
export interface ReviewRecallRate {
    /** Which review of an item: 1, 2 or 3. */
    readonly n: number
    /** The share of those reviews graded good or easy, 0 to 1. */
    readonly rate: number
}

/** The review statistics of a learner. */
export interface ReviewStatsView {
    /** The active days a week over the days asked. */
    readonly activeDaysPerWeek: number
    /** The recall rate by review number. */
    readonly recallRateByReview: ReadonlyArray<ReviewRecallRate>
}

/** The counts the hub reads. */
export interface ReviewSummary {
    /** The day (Asia/Ho_Chi_Minh). */
    readonly date: string
    /** Items due today, overdue included, that the learner can review. */
    readonly due: number
    /** The part of `due` that is before today. */
    readonly overdue: number
    /** New items offered today. */
    readonly newAvailable: number
    /** The daily goal. */
    readonly goalDaily: number
    /** Items reviewed today. */
    readonly doneToday: number
}

/** One review a lesson opened after its completion: the 1, 7 or 21 day retrieval. */
export interface LessonReviewSlotView {
    /** The retrieval activity. */
    readonly activityId: string
    /** The days after completion. */
    readonly afterDays: number
    /** The day it falls due, `YYYY-MM-DD`. */
    readonly dueOn: string
    /** Whether the learner finished it. */
    readonly done: boolean
}
