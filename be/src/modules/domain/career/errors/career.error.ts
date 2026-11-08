import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the career capability (contract.career.api). */
export enum CareerErrorCode {
    /** No item of this learner, or no verification code, matches. */
    ItemNotFound = "CAREER_ITEM_NOT_FOUND",
    /** Submitting an item for review needs Premium. */
    PremiumRequired = "CAREER_PREMIUM_REQUIRED",
    /** The item is not in a state that allows the action. */
    StateConflict = "CAREER_STATE_CONFLICT",
    /** The submitted line changed a value filled from the evidence, or added a number the evidence does not hold. */
    LineSlotChanged = "CAREER_LINE_SLOT_CHANGED",
    /** A returned item was resubmitted with the same line and the same evidence. */
    ResubmitUnchanged = "CAREER_RESUBMIT_UNCHANGED",
    /** The action needs a verified item. */
    NotVerified = "CAREER_NOT_VERIFIED",
    /** The caller holds no role, scope or appointment for this item, or it is their own item. */
    ReviewForbidden = "CAREER_REVIEW_FORBIDDEN",
    /** A signer acted on their own item, or was to be assigned their own item. */
    SelfReview = "CAREER_SELF_REVIEW",
    /** Another signer decided the item first. */
    ReviewConflict = "CAREER_REVIEW_CONFLICT",
    /** A return or a revoke needs a note. */
    ReviewNoteRequired = "CAREER_REVIEW_NOTE_REQUIRED",
    /** No active reviewer has this subject. */
    ReviewerNotFound = "CAREER_REVIEWER_NOT_FOUND",
    /** A producer named an item type the catalog does not hold, or evidence the type does not take. */
    ItemTypeUnknown = "CAREER_ITEM_TYPE_UNKNOWN",
    /** A write did not answer the row it should have stored; a defect, never a refusal. */
    ItemNotSaved = "CAREER_ITEM_NOT_SAVED",
    /** The development seed was asked for where it is not enabled (production never enables it). */
    DevSeedDisabled = "CAREER_DEV_SEED_DISABLED",
}

/** How each career code travels. */
export const CAREER_ERROR_KINDS: Record<CareerErrorCode, ErrorKind> = {
    [CareerErrorCode.ItemNotFound]: "not-found",
    [CareerErrorCode.PremiumRequired]: "forbidden",
    [CareerErrorCode.StateConflict]: "conflict",
    [CareerErrorCode.LineSlotChanged]: "invalid",
    [CareerErrorCode.ResubmitUnchanged]: "conflict",
    [CareerErrorCode.NotVerified]: "conflict",
    [CareerErrorCode.ReviewForbidden]: "forbidden",
    [CareerErrorCode.SelfReview]: "forbidden",
    [CareerErrorCode.ReviewConflict]: "conflict",
    [CareerErrorCode.ReviewNoteRequired]: "invalid",
    [CareerErrorCode.ReviewerNotFound]: "not-found",
    [CareerErrorCode.ItemTypeUnknown]: "invalid",
    [CareerErrorCode.ItemNotSaved]: "internal",
    [CareerErrorCode.DevSeedDisabled]: "forbidden",
}

/** The one error class of the career capability. */
export class CareerError extends DomainError<CareerErrorCode> {}
