import { DomainError, type ErrorKind } from "@modules/platform/errors"

/** Codes of the identity capability. */
export enum IdentityErrorCode {
    /** The door needs a signed-in caller and the request establishes none. */
    Unauthenticated = "IDENTITY_UNAUTHENTICATED",
    /** No current unexpired, unrevoked durable application session exists. */
    SessionRequired = "IDENTITY_SESSION_REQUIRED",
    /** Durable session state could not be read or safely changed. */
    SessionUnavailable = "IDENTITY_SESSION_UNAVAILABLE",
    /** The identity provider or the mail service could not complete the step. */
    ProviderUnavailable = "IDENTITY_PROVIDER_UNAVAILABLE",
    /** The identifier and password pair was refused; the code never says which part. */
    CredentialsRejected = "IDENTITY_CREDENTIALS_REJECTED",
    /** The emailed code is wrong; the params carry `attemptsLeft`. */
    CodeMismatch = "IDENTITY_CODE_MISMATCH",
    /** The challenge is unknown, expired, consumed or out of attempts. */
    ChallengeExpired = "IDENTITY_CHALLENGE_EXPIRED",
    /** The email already belongs to an account. */
    EmailRegistered = "IDENTITY_EMAIL_REGISTERED",
    /** The password is outside 6 to 256 characters or refused by the provider's policy. */
    PasswordInvalid = "IDENTITY_PASSWORD_INVALID",
    /** The username is outside 3 to 100 characters. */
    UsernameInvalid = "IDENTITY_USERNAME_INVALID",
    /** The social provider is not one of the offered providers. */
    ProviderUnknown = "IDENTITY_PROVIDER_UNKNOWN",
    /** The social state is unknown, expired, replayed or malformed. */
    SocialStateInvalid = "IDENTITY_SOCIAL_STATE_INVALID",
    /** The social provider refused the exchange. */
    SocialRejected = "IDENTITY_SOCIAL_REJECTED",
}

/** How each identity code travels. */
export const IDENTITY_ERROR_KINDS: Record<IdentityErrorCode, ErrorKind> = {
    [IdentityErrorCode.Unauthenticated]: "unauthenticated",
    [IdentityErrorCode.SessionRequired]: "unauthenticated",
    [IdentityErrorCode.SessionUnavailable]: "unavailable",
    [IdentityErrorCode.ProviderUnavailable]: "unavailable",
    [IdentityErrorCode.CredentialsRejected]: "unauthenticated",
    [IdentityErrorCode.CodeMismatch]: "invalid",
    [IdentityErrorCode.ChallengeExpired]: "not-found",
    [IdentityErrorCode.EmailRegistered]: "conflict",
    [IdentityErrorCode.PasswordInvalid]: "invalid",
    [IdentityErrorCode.UsernameInvalid]: "invalid",
    [IdentityErrorCode.ProviderUnknown]: "invalid",
    [IdentityErrorCode.SocialStateInvalid]: "invalid",
    [IdentityErrorCode.SocialRejected]: "unauthenticated",
}

/** The one error class of the identity capability. */
export class IdentityError extends DomainError<IdentityErrorCode> {}
