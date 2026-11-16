import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the harness capability (the standalone /harness area). */
export enum HarnessErrorCode {
    /** No live build, guide, doc, probe pack or trap has this key. */
    NotFound = "HARNESS_NOT_FOUND",
    /** The project is not an agent project of this learner. */
    ProjectInvalid = "HARNESS_PROJECT_INVALID",
    /** The raw harness tree has findings that block its import; they are logged with their paths. */
    ContentInvalid = "HARNESS_CONTENT_INVALID",
    /** The version exists with other bytes; a stored version never changes. */
    VersionConflict = "HARNESS_VERSION_CONFLICT",
    /** The import was not given a usable directory or ref. */
    ImportRejected = "HARNESS_IMPORT_REJECTED",
}

/** How each harness code travels. */
export const HARNESS_ERROR_KINDS: Record<HarnessErrorCode, ErrorKind> = {
    [HarnessErrorCode.NotFound]: "not-found",
    [HarnessErrorCode.ProjectInvalid]: "forbidden",
    [HarnessErrorCode.ContentInvalid]: "invalid",
    [HarnessErrorCode.VersionConflict]: "conflict",
    [HarnessErrorCode.ImportRejected]: "invalid",
}

/** The one error class of the harness capability. */
export class HarnessError extends DomainError<HarnessErrorCode> {}
