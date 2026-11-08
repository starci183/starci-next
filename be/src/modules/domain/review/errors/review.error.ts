import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the review capability. */
export enum ReviewErrorCode {
    /** The learner has no such item in the queue, or the item is no longer published. */
    ItemNotFound = "REVIEW_ITEM_NOT_FOUND",
    /** The item is Premium and the learner holds none. */
    PremiumRequired = "REVIEW_PREMIUM_REQUIRED",
    /** The revision was already graded with another grade, or is not the next revision of the item. */
    RevisionConflict = "REVIEW_REVISION_CONFLICT",
    /** The item was graded before the card was flipped or the written answer was submitted. */
    NotFlipped = "REVIEW_NOT_FLIPPED",
    /** The grade is not one of again, hard, good and easy. */
    GradeInvalid = "REVIEW_GRADE_INVALID",
    /** The written answer is empty or too long, or the door does not fit the item (a card has no written answer). */
    AnswerInvalid = "REVIEW_ANSWER_INVALID",
    /** No deck has this id. */
    DeckNotFound = "REVIEW_DECK_NOT_FOUND",
    /** The deck version exists with other bytes; a published deck version never changes. */
    DeckImmutable = "REVIEW_DECK_IMMUTABLE",
    /** The deck source has an issue that blocks its import; the issues are logged with their paths. */
    DeckInvalid = "REVIEW_DECK_INVALID",
    /** The daily goal is outside 5 to 50 items. */
    GoalInvalid = "REVIEW_GOAL_INVALID",
    /** The import was not given a usable directory or ref, or names a deck that does not exist. */
    ImportRejected = "REVIEW_IMPORT_REJECTED",
}

/** How each review code travels. */
export const REVIEW_ERROR_KINDS: Record<ReviewErrorCode, ErrorKind> = {
    [ReviewErrorCode.ItemNotFound]: "not-found",
    [ReviewErrorCode.PremiumRequired]: "forbidden",
    [ReviewErrorCode.RevisionConflict]: "conflict",
    [ReviewErrorCode.NotFlipped]: "conflict",
    [ReviewErrorCode.GradeInvalid]: "invalid",
    [ReviewErrorCode.AnswerInvalid]: "invalid",
    [ReviewErrorCode.DeckNotFound]: "not-found",
    [ReviewErrorCode.DeckImmutable]: "conflict",
    [ReviewErrorCode.DeckInvalid]: "invalid",
    [ReviewErrorCode.GoalInvalid]: "invalid",
    [ReviewErrorCode.ImportRejected]: "invalid",
}

/** The one error class of the review capability. */
export class ReviewError extends DomainError<ReviewErrorCode> {}
