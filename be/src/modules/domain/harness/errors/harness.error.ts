import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the harness capability (the standalone /harness area). */
export enum HarnessErrorCode {
    /** No live build, guide, doc, probe pack or trap has this key. */
    NotFound = "HARNESS_NOT_FOUND",
    /** The repository is not a GitHub owner/name or address. */
    RepositoryInvalid = "HARNESS_REPOSITORY_INVALID",
    /** A CI delivery names no binding of the harness. */
    CiBindingUnknown = "HARNESS_CI_BINDING_UNKNOWN",
    /** A CI delivery is not the result document. */
    CiPayloadInvalid = "HARNESS_CI_PAYLOAD_INVALID",
    /** GitHub did not vouch for the run: only an attested run is proof, so it is refused rather than recorded as practice. */
    CiNotAttested = "HARNESS_CI_NOT_ATTESTED",
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
    [HarnessErrorCode.RepositoryInvalid]: "invalid",
    [HarnessErrorCode.CiBindingUnknown]: "unauthenticated",
    [HarnessErrorCode.CiPayloadInvalid]: "invalid",
    [HarnessErrorCode.CiNotAttested]: "forbidden",
    [HarnessErrorCode.ContentInvalid]: "invalid",
    [HarnessErrorCode.VersionConflict]: "conflict",
    [HarnessErrorCode.ImportRejected]: "invalid",
}

/** The one error class of the harness capability. */
export class HarnessError extends DomainError<HarnessErrorCode> {}
