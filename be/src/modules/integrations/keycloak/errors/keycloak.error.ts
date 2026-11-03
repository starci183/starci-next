import { DomainError } from "@modules/platform/errors"
import type { ErrorKind } from "@modules/platform/errors"

/** Provider-boundary refusals, with no token, callback query or provider prose in their text. */
export enum KeycloakErrorCode {
    /** A deployment key does not meet the registered-client contract. */
    ConfigurationInvalid = "KEYCLOAK_CONFIGURATION_INVALID",
    /** The provider could not be reached or returned a failed HTTP response. */
    Unavailable = "KEYCLOAK_UNAVAILABLE",
    /** Discovery or a token response is malformed or identity validation failed. */
    Rejected = "KEYCLOAK_REJECTED",
}

/** Transport kinds of the provider-boundary codes. */
export const KEYCLOAK_ERROR_KINDS: Record<KeycloakErrorCode, ErrorKind> = {
    [KeycloakErrorCode.ConfigurationInvalid]: "invalid",
    [KeycloakErrorCode.Unavailable]: "unavailable",
    [KeycloakErrorCode.Rejected]: "unauthenticated",
}

/** Keeps a stable boundary code and the underlying cause without exposing provider prose. */
export class KeycloakError extends DomainError<KeycloakErrorCode> {}
