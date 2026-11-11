import type {
    ReviewCardBack,
    ReviewCardFront,
    ReviewGrade,
    ReviewLevel,
    ReviewLocale,
    ReviewSource,
    ReviewStatus,
} from "../review.contracts"

/** A stored hash of a deck version. */
export interface DeckHashRow {
    /** The content hash. */
    content_hash: string
}

/** A learner's state for an item. */
export interface StateRow {
    /** The item. */
    item_id: string
    /** Flashcard or retrieval. */
    source: ReviewSource
    /** The status. */
    status: ReviewStatus
    /** The ladder step. */
    step: number
    /** The due day, yyyy-mm-dd. */
    due_on: string
    /** The deck of a card. */
    deck_id: string | null
    /** The lesson of a retrieval item. */
    lesson_id: string | null
    /** The retrieval activity. */
    activity_id: string | null
    /** The lesson version of a retrieval item. */
    lesson_version: string | null
    /** The newest stored revision. */
    last_revision: number
    /** The revision whose answer was revealed. */
    flipped_revision: number
}

/** A row of the queue: a state with what the list shows of its card or deck. */
export interface QueueRow extends StateRow {
    /** Whether the card needs Premium; null for a retrieval item. */
    is_premium: boolean | null
    /** The level of a card. */
    level: ReviewLevel | null
    /** The deck titles by locale. */
    deck_titles: Readonly<Record<ReviewLocale, string>> | null
}

/** A card of the live version of its deck. */
export interface CardRow {
    /** The item. */
    item_id: string
    /** The deck. */
    deck_id: string
    /** Whether the card needs Premium. */
    is_premium: boolean
    /** The level. */
    level: ReviewLevel
    /** The code language. */
    langs: string | null
    /** The front by locale. */
    front: Readonly<Record<ReviewLocale, ReviewCardFront>>
    /** The back by locale. */
    back: Readonly<Record<ReviewLocale, ReviewCardBack>>
    /** The deck titles by locale. */
    deck_titles: Readonly<Record<ReviewLocale, string>>
}

/** A stored review. */
export interface ReviewRow {
    /** The grade. */
    grade: ReviewGrade
}

/** A count. */
export interface CountRow {
    /** The count. */
    total: number
}

/** The daily goal. */
export interface GoalRow {
    /** The items a day. */
    daily_goal: number
}

/** A deck of the picker. */
export interface DeckRow {
    /** The deck. */
    deck_id: string
    /** The course. */
    course: string
    /** The titles by locale. */
    titles: Readonly<Record<ReviewLocale, string>>
    /** The descriptions by locale. */
    descriptions: Readonly<Record<ReviewLocale, string>>
    /** The difficulty. */
    difficulty: string
    /** The cards. */
    card_count: number
    /** The free cards. */
    free_card_count: number
    /** The tracks. */
    tracks: ReadonlyArray<string>
    /** Whether the learner added the deck. */
    added: boolean
}

/** The recall counts of the n-th review. */
export interface RecallRow {
    /** Which review of an item. */
    n: number
    /** The reviews counted. */
    total: number
    /** The reviews graded good or easy. */
    recalled: number
}

/** A graded activity of a lesson. */
export interface GradedActivityRow {
    /** The activity. */
    activity_id: string
}

/** An affected-row count. */
export interface AffectedRow {
    /** The count. */
    total: number
}

/** A retrieval item a lesson opened for a learner. */
export interface LessonRetrievalRow {
    /** The retrieval activity. */
    activity_id: string
    /** The days after completion it is asked again. */
    after_days: number
    /** The day it falls due, `YYYY-MM-DD`. */
    due_on: string
    /** Where the item stands: learning, review, done or suspended. */
    status: string
}
