import { DomainError } from "@modules/platform/errors"
import type { ErrorKind } from "@modules/platform/errors"

/** Codes of the identity capability. */
export enum IdentityErrorCode {
    /** The door needs a signed-in caller and the request establishes none. */
    Unauthenticated = "IDENTITY_UNAUTHENTICATED",
    /** No current unexpired, unrevoked durable application session exists. */
    SessionRequired = "IDENTITY_SESSION_REQUIRED",
    /** Durable session state could not be read or safely changed. */
    SessionUnavailable = "IDENTITY_SESSION_UNAVAILABLE",
    /** The provider could not begin the authentication protocol. */
    ProviderUnavailable = "IDENTITY_PROVIDER_UNAVAILABLE",
}

/** How each identity code travels. */
export const IDENTITY_ERROR_KINDS: Record<IdentityErrorCode, ErrorKind> = {
    [IdentityErrorCode.Unauthenticated]: "unauthenticated",
    [IdentityErrorCode.SessionRequired]: "unauthenticated",
    [IdentityErrorCode.SessionUnavailable]: "unavailable",
    [IdentityErrorCode.ProviderUnavailable]: "unavailable",
}

/** The one error class of the identity capability. */
export class IdentityError extends DomainError<IdentityErrorCode> {}
