import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the path capability (the goal layer, the outcome paths). */
export enum PathErrorCode {
    /** No outcome path of the catalog has this id. */
    NotFound = "PATH_NOT_FOUND",
}

/** How each path code travels. */
export const PATH_ERROR_KINDS: Record<PathErrorCode, ErrorKind> = {
    [PathErrorCode.NotFound]: "not-found",
}

/** The one error class of the path capability. */
export class PathError extends DomainError<PathErrorCode> {}
