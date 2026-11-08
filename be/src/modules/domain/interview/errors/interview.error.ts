import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the interview capability. */
export enum InterviewErrorCode {
    /** No session of this learner has this id. */
    SessionNotFound = "INTERVIEW_SESSION_NOT_FOUND",
    /** The learner holds no Premium and has used the free sessions of this month. */
    PremiumRequired = "INTERVIEW_PREMIUM_REQUIRED",
    /** The learner already has a session in progress. */
    SessionActive = "INTERVIEW_SESSION_ACTIVE",
    /** The banks hold too few questions at the chosen track, tier and language. */
    PoolEmpty = "INTERVIEW_POOL_EMPTY",
    /** The learner reached the fair-use limit of AI calls for the day; the transcript stays saved. */
    AiLimitReached = "INTERVIEW_AI_LIMIT_REACHED",
    /** The setup names a track, tier, locale, language or length the interview does not offer. */
    SetupInvalid = "INTERVIEW_SETUP_INVALID",
    /** The revision was already stored with another answer. */
    RevisionConflict = "INTERVIEW_REVISION_CONFLICT",
    /** The session is submitted, graded or abandoned and takes no more turns. */
    SessionClosed = "INTERVIEW_SESSION_CLOSED",
    /** The answer does not fit the question that is open, or is empty. */
    AnswerInvalid = "INTERVIEW_ANSWER_INVALID",
    /** The open question has no hint left to give. */
    HintNoneLeft = "INTERVIEW_HINT_NONE_LEFT",
    /** No interviewer turn or grading is waiting for a retry. */
    NothingToRetry = "INTERVIEW_NOTHING_TO_RETRY",
    /** The session holds no answer to grade. */
    NoAnswer = "INTERVIEW_NO_ANSWER",
    /** The version exists with other bytes; a published bank version never changes. */
    BankImmutable = "INTERVIEW_BANK_IMMUTABLE",
    /** The source bank has an issue that blocks it; the issues are logged with their paths. */
    BankInvalid = "INTERVIEW_BANK_INVALID",
    /** The grader did not keep the order or the scores of the authored sample answers of a bank. */
    CalibrationFailed = "INTERVIEW_CALIBRATION_FAILED",
    /** The import was not given a usable directory or ref, or names a bank that does not exist. */
    ImportRejected = "INTERVIEW_IMPORT_REJECTED",
    /** No AI provider is configured, so the interviewer and the grader cannot run. */
    CoachUnconfigured = "INTERVIEW_COACH_UNCONFIGURED",
    /** The AI did not answer in time or failed; the transcript stays saved and the step can be retried. */
    CoachUnavailable = "INTERVIEW_COACH_UNAVAILABLE",
    /** The AI answered something the interview does not accept; nothing of it is stored. */
    CoachInvalid = "INTERVIEW_COACH_INVALID",
}

/** How each interview code travels. */
export const INTERVIEW_ERROR_KINDS: Record<InterviewErrorCode, ErrorKind> = {
    [InterviewErrorCode.SessionNotFound]: "not-found",
    [InterviewErrorCode.PremiumRequired]: "forbidden",
    [InterviewErrorCode.SessionActive]: "conflict",
    [InterviewErrorCode.PoolEmpty]: "not-found",
    [InterviewErrorCode.AiLimitReached]: "rate-limited",
    [InterviewErrorCode.SetupInvalid]: "invalid",
    [InterviewErrorCode.RevisionConflict]: "conflict",
    [InterviewErrorCode.SessionClosed]: "conflict",
    [InterviewErrorCode.AnswerInvalid]: "invalid",
    [InterviewErrorCode.HintNoneLeft]: "not-found",
    [InterviewErrorCode.NothingToRetry]: "conflict",
    [InterviewErrorCode.NoAnswer]: "invalid",
    [InterviewErrorCode.BankImmutable]: "conflict",
    [InterviewErrorCode.BankInvalid]: "invalid",
    [InterviewErrorCode.CalibrationFailed]: "invalid",
    [InterviewErrorCode.ImportRejected]: "invalid",
    [InterviewErrorCode.CoachUnconfigured]: "unavailable",
    [InterviewErrorCode.CoachUnavailable]: "unavailable",
    [InterviewErrorCode.CoachInvalid]: "internal",
}

/** The one error class of the interview capability. */
export class InterviewError extends DomainError<InterviewErrorCode> {}
