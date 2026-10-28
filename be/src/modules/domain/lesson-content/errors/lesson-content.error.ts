import { DomainError } from "@modules/platform/errors"
import type { ErrorKind } from "@modules/platform/errors"

/** Codes of the lesson-content capability. */
export enum LessonContentErrorCode {
    /** The manifest is not the versioned machine input this importer understands. */
    ManifestInvalid = "LESSON_CONTENT_MANIFEST_INVALID",
    /** A source file is missing, or its bytes or SHA-256 differ from the manifest. */
    SourceMismatch = "LESSON_CONTENT_SOURCE_MISMATCH",
    /** A source file does not have the Academy separator structure the importer expects. */
    SourceMalformed = "LESSON_CONTENT_SOURCE_MALFORMED",
    /** A source holds a grading field or interview child the importer cannot classify; the import fails closed. */
    ClassificationUnknown = "LESSON_CONTENT_CLASSIFICATION_UNKNOWN",
    /** The byte indexes the importer derived differ from the ones the manifest records. */
    IndexMismatch = "LESSON_CONTENT_INDEX_MISMATCH",
    /** The same version was imported again with different bytes; a new immutable version is required. */
    VersionConflict = "LESSON_CONTENT_VERSION_CONFLICT",
    /** No published lesson has this id or version. */
    NotFound = "LESSON_CONTENT_NOT_FOUND",
    /** The requested locale and programming language combination is not published; the available ones ride in the params. */
    VariantUnavailable = "LESSON_CONTENT_VARIANT_UNAVAILABLE",
    /** A reveal was asked for an item the learner has not answered. */
    AnswerRequired = "LESSON_CONTENT_ANSWER_REQUIRED",
    /** A stored payload does not have the shape the importer wrote; the row is corrupt. */
    PayloadCorrupt = "LESSON_CONTENT_PAYLOAD_CORRUPT",
}

/** How each lesson-content code travels. */
export const LESSON_CONTENT_ERROR_KINDS: Record<LessonContentErrorCode, ErrorKind> = {
    [LessonContentErrorCode.ManifestInvalid]: "invalid",
    [LessonContentErrorCode.SourceMismatch]: "invalid",
    [LessonContentErrorCode.SourceMalformed]: "invalid",
    [LessonContentErrorCode.ClassificationUnknown]: "invalid",
    [LessonContentErrorCode.IndexMismatch]: "invalid",
    [LessonContentErrorCode.VersionConflict]: "conflict",
    [LessonContentErrorCode.NotFound]: "not-found",
    [LessonContentErrorCode.VariantUnavailable]: "not-found",
    [LessonContentErrorCode.AnswerRequired]: "forbidden",
    [LessonContentErrorCode.PayloadCorrupt]: "internal",
}

/** The one error class of the lesson-content capability. */
export class LessonContentError extends DomainError<LessonContentErrorCode> {}
