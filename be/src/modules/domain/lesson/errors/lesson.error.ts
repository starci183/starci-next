import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the lesson capability. */
export enum LessonErrorCode {
    /** No live lesson has this id, or no stored version matches it. */
    NotFound = "LESSON_NOT_FOUND",
    /** No topic has this slug, or no published lesson belongs to it. */
    TopicNotFound = "LESSON_TOPIC_NOT_FOUND",
    /** The version exists with other bytes; a published version never changes. */
    VersionImmutable = "LESSON_VERSION_IMMUTABLE",
    /** The source folder has an issue that blocks its import; the issues are logged with their paths. */
    ContentInvalid = "LESSON_CONTENT_INVALID",
    /** The import was not given a usable directory or ref, or names a folder that does not exist. */
    ImportRejected = "LESSON_IMPORT_REJECTED",
    /** The content is Premium and the learner holds none. */
    PremiumRequired = "LESSON_PREMIUM_REQUIRED",
}

/** How each lesson code travels. */
export const LESSON_ERROR_KINDS: Record<LessonErrorCode, ErrorKind> = {
    [LessonErrorCode.NotFound]: "not-found",
    [LessonErrorCode.TopicNotFound]: "not-found",
    [LessonErrorCode.VersionImmutable]: "conflict",
    [LessonErrorCode.ContentInvalid]: "invalid",
    [LessonErrorCode.ImportRejected]: "invalid",
    [LessonErrorCode.PremiumRequired]: "forbidden",
}

/** The one error class of the lesson capability. */
export class LessonError extends DomainError<LessonErrorCode> {}
