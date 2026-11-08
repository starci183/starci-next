import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the attempt capability. */
export enum AttemptErrorCode {
    /** No attempt of this learner has this id. */
    NotFound = "ATTEMPT_NOT_FOUND",
    /** The revision was already submitted with another answer; a new answer needs a new revision. */
    RevisionConflict = "ATTEMPT_REVISION_CONFLICT",
    /** The answer does not fit the activity: an option it does not list, a path its state machine does not allow, or no text. */
    AnswerInvalid = "ATTEMPT_ANSWER_INVALID",
    /** The activity has no attempt door: a review activity, or a written activity without a rubric. */
    ActivityUnsupported = "ATTEMPT_ACTIVITY_UNSUPPORTED",
    /** The attempt was stored but cannot be read back. */
    NotSaved = "ATTEMPT_NOT_SAVED",
    /** No AI provider is configured for the coach, so a written answer is saved and cannot be graded yet. */
    CoachUnconfigured = "ATTEMPT_COACH_UNCONFIGURED",
    /** The coach did not answer in time or failed; the answer stays saved and grading can be retried. */
    CoachUnavailable = "ATTEMPT_COACH_UNAVAILABLE",
    /** The coach answered something the rubric does not accept; nothing of it is stored. */
    CoachInvalid = "ATTEMPT_COACH_INVALID",
    /** The learner reached the fair-use limit of AI gradings for the day; the answer stays saved and can be graded again tomorrow. */
    CoachLimitReached = "ATTEMPT_COACH_LIMIT_REACHED",
}

/** How each attempt code travels. */
export const ATTEMPT_ERROR_KINDS: Record<AttemptErrorCode, ErrorKind> = {
    [AttemptErrorCode.NotFound]: "not-found",
    [AttemptErrorCode.RevisionConflict]: "conflict",
    [AttemptErrorCode.AnswerInvalid]: "invalid",
    [AttemptErrorCode.ActivityUnsupported]: "invalid",
    [AttemptErrorCode.NotSaved]: "internal",
    [AttemptErrorCode.CoachUnconfigured]: "unavailable",
    [AttemptErrorCode.CoachUnavailable]: "unavailable",
    [AttemptErrorCode.CoachInvalid]: "internal",
    [AttemptErrorCode.CoachLimitReached]: "rate-limited",
}

/** The one error class of the attempt capability. */
export class AttemptError extends DomainError<AttemptErrorCode> {}
