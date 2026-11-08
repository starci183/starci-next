import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the practice capability. */
export enum PracticeErrorCode {
    /** No live problem has this slug. */
    ProblemNotFound = "PRACTICE_PROBLEM_NOT_FOUND",
    /** No pattern has this id. */
    PatternNotFound = "PRACTICE_PATTERN_NOT_FOUND",
    /** No submission of this learner has this id. */
    SubmissionNotFound = "PRACTICE_SUBMISSION_NOT_FOUND",
    /** The problem is beyond the free ones of its pattern and the learner holds no Premium. */
    ProblemLocked = "PRACTICE_PROBLEM_LOCKED",
    /** The learner has a submission in flight or sent too many in the last minute. */
    RateLimited = "PRACTICE_RATE_LIMITED",
    /** The language is not one of the five the problems have starter codes for. */
    LanguageUnsupported = "PRACTICE_LANGUAGE_UNSUPPORTED",
    /** The source is larger than a submission may be. */
    SourceTooLarge = "PRACTICE_SOURCE_TOO_LARGE",
    /** The source has no code. */
    SourceEmpty = "PRACTICE_SOURCE_EMPTY",
    /** A hint step was asked out of order: each step opens only after the one before it. */
    HintOutOfOrder = "PRACTICE_HINT_OUT_OF_ORDER",
    /** The submission was stored but cannot be read back. */
    NotSaved = "PRACTICE_NOT_SAVED",
    /** The source folder has an issue that blocks its import; the issues are logged with their paths. */
    ContentInvalid = "PRACTICE_CONTENT_INVALID",
    /** The version exists with other bytes; a published version never changes. */
    VersionImmutable = "PRACTICE_VERSION_IMMUTABLE",
    /** The import was not given a usable directory or ref, or names a pattern that does not exist. */
    ImportRejected = "PRACTICE_IMPORT_REJECTED",
}

/** How each practice code travels. */
export const PRACTICE_ERROR_KINDS: Record<PracticeErrorCode, ErrorKind> = {
    [PracticeErrorCode.ProblemNotFound]: "not-found",
    [PracticeErrorCode.PatternNotFound]: "not-found",
    [PracticeErrorCode.SubmissionNotFound]: "not-found",
    [PracticeErrorCode.ProblemLocked]: "forbidden",
    [PracticeErrorCode.RateLimited]: "rate-limited",
    [PracticeErrorCode.LanguageUnsupported]: "invalid",
    [PracticeErrorCode.SourceTooLarge]: "invalid",
    [PracticeErrorCode.SourceEmpty]: "invalid",
    [PracticeErrorCode.HintOutOfOrder]: "conflict",
    [PracticeErrorCode.NotSaved]: "internal",
    [PracticeErrorCode.ContentInvalid]: "invalid",
    [PracticeErrorCode.VersionImmutable]: "conflict",
    [PracticeErrorCode.ImportRejected]: "invalid",
}

/** The one error class of the practice capability. */
export class PracticeError extends DomainError<PracticeErrorCode> {}
