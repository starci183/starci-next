import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the Judge0 integration. */
export enum Judge0ErrorCode {
    /** A declared Judge0 setting names a value the client cannot run with. */
    ConfigInvalid = "JUDGE0_CONFIG_INVALID",
    /** This instance declares no Judge0 endpoint, so no code can be run. */
    NotConfigured = "JUDGE0_NOT_CONFIGURED",
    /** Judge0 could not be reached or did not answer within the deadline. */
    Unavailable = "JUDGE0_UNAVAILABLE",
    /** Judge0 refused the request or answered something that is not a judged batch. */
    Rejected = "JUDGE0_REJECTED",
}

/** How each Judge0 code travels. */
export const JUDGE0_ERROR_KINDS: Record<Judge0ErrorCode, ErrorKind> = {
    [Judge0ErrorCode.ConfigInvalid]: "internal",
    [Judge0ErrorCode.NotConfigured]: "unavailable",
    [Judge0ErrorCode.Unavailable]: "unavailable",
    [Judge0ErrorCode.Rejected]: "internal",
}

/** The one error class of the Judge0 integration. */
export class Judge0Error extends DomainError<Judge0ErrorCode> {}
