import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the course capability. */
export enum CourseErrorCode {
    /** The lab is a part beyond the free one of Essentials, which needs Premium. */
    PremiumRequired = "COURSE_PREMIUM_REQUIRED",
    /** No lesson has a live lab record under this id. */
    LessonNotFound = "COURSE_LESSON_NOT_FOUND",
    /** The lab has no case with this id. */
    CaseNotFound = "COURSE_CASE_NOT_FOUND",
    /** The case is not open yet: the case before it was never green. */
    CaseLocked = "COURSE_CASE_LOCKED",
    /** A hint level was asked for before the level below it was opened. */
    HintOutOfOrder = "COURSE_HINT_OUT_OF_ORDER",
    /** The case has no hint at this level. */
    HintNotFound = "COURSE_HINT_NOT_FOUND",
    /** An upload from the learner's machine is not well formed or names a case the lab does not have. */
    PayloadInvalid = "COURSE_PAYLOAD_INVALID",
}

/** How each course code travels. */
export const COURSE_ERROR_KINDS: Record<CourseErrorCode, ErrorKind> = {
    [CourseErrorCode.PremiumRequired]: "forbidden",
    [CourseErrorCode.LessonNotFound]: "not-found",
    [CourseErrorCode.CaseNotFound]: "not-found",
    [CourseErrorCode.CaseLocked]: "forbidden",
    [CourseErrorCode.HintOutOfOrder]: "conflict",
    [CourseErrorCode.HintNotFound]: "not-found",
    [CourseErrorCode.PayloadInvalid]: "invalid",
}

/** The one error class of the course capability. */
export class CourseError extends DomainError<CourseErrorCode> {}
