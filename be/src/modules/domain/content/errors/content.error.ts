import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the content capability. */
export enum ContentErrorCode {
    /** The sync names no usable source: no local directory, no git mount, or a directory that does not exist. */
    SyncRejected = "CONTENT_SYNC_REJECTED",
    /** The git pull of a repository failed; the log names the repository and the git step, never the token. */
    PullFailed = "CONTENT_PULL_FAILED",
    /** A file of the content repository does not match its schema; the log names the file and the field. */
    ManifestInvalid = "CONTENT_MANIFEST_INVALID",
    /** One or more kinds failed to import; the live versions are untouched and the log names each kind. */
    SyncFailed = "CONTENT_SYNC_FAILED",
}

/** How each content code travels. */
export const CONTENT_ERROR_KINDS: Record<ContentErrorCode, ErrorKind> = {
    [ContentErrorCode.SyncRejected]: "invalid",
    [ContentErrorCode.PullFailed]: "internal",
    [ContentErrorCode.ManifestInvalid]: "invalid",
    [ContentErrorCode.SyncFailed]: "internal",
}

/** The one error class of the content capability. */
export class ContentError extends DomainError<ContentErrorCode> {}
