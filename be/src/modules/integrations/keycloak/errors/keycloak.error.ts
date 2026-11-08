import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Provider-boundary refusals, with no password, token, code or provider prose in their text. */
export enum KeycloakErrorCode {
    /** The provider could not be reached, answered a server error or answered something unusable. */
    Unavailable = "KEYCLOAK_UNAVAILABLE",
    /** The provider refused the password, the refresh token or the account; it never says which. */
    CredentialsRejected = "KEYCLOAK_CREDENTIALS_REJECTED",
    /** An account with this email (or username) already exists in the realm. */
    EmailRegistered = "KEYCLOAK_EMAIL_REGISTERED",
    /** The realm's password policy refused the password. */
    PasswordInvalid = "KEYCLOAK_PASSWORD_INVALID",
    /** The social sign-in did not complete: the code, the verifier or the ID token was refused. */
    SocialRejected = "KEYCLOAK_SOCIAL_REJECTED",
}

/** Transport kinds of the provider-boundary codes. */
export const KEYCLOAK_ERROR_KINDS: Record<KeycloakErrorCode, ErrorKind> = {
    [KeycloakErrorCode.Unavailable]: "unavailable",
    [KeycloakErrorCode.CredentialsRejected]: "unauthenticated",
    [KeycloakErrorCode.EmailRegistered]: "conflict",
    [KeycloakErrorCode.PasswordInvalid]: "invalid",
    [KeycloakErrorCode.SocialRejected]: "unauthenticated",
}

/** Keeps a stable boundary code and the underlying cause without exposing provider prose. */
export class KeycloakError extends DomainError<KeycloakErrorCode> {}
