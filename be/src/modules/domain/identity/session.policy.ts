import { createHash, randomBytes } from "node:crypto"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import type { IdentitySessionOptions } from "./identity.options"

/** The only application authentication cookie. */
export const IDENTITY_SESSION_COOKIE = "__Host-identity_session"

/**
 * The short-lived pre-authentication cookie that binds a social sign-in in flight to the browser that started it: it holds
 * the state the start minted, and the exchange refuses a state this browser did not start (login CSRF).
 */
export const IDENTITY_SOCIAL_COOKIE = "__Host-identity_social"

/** A session refreshes its provider tokens once the refresh token has less than this much life left. */
export const REFRESH_AHEAD_SECONDS = 300

/** The shortest sealing secret identity accepts. */
export const MIN_ENCRYPTION_KEY_LENGTH = 32

/** The timing facts of one stored session that decide whether it needs a refresh. */
export interface SessionTiming {
    /** When the session was created. */
    readonly issuedAt: Date
    /** The effective end of the session. */
    readonly expiresAt: Date
    /** When the provider refresh token stops working. */
    readonly refreshExpiresAt: Date
}

/** Mints 256 unpredictable bits for one protocol value or opaque reference. */
export const randomReference = (): string => randomBytes(32).toString("base64url")

/** Stores only a one-way digest of a browser credential or transient state. */
export const referenceDigest = (reference: string): string => createHash("sha256").update(reference).digest("hex")

/** Builds the S256 challenge sent instead of the confidential verifier. */
export const pkceChallenge = (verifier: string): string => createHash("sha256").update(verifier).digest("base64url")

/** Accepts only the fixed-length credential this capability mints. */
export const validReference = (reference: string | undefined): reference is string =>
    reference !== undefined && /^[A-Za-z0-9_-]{43}$/.test(reference)

/** Refuses a nonpositive tunable or a short sealing secret before any state can be issued. */
export const validateIdentityOptions = (options: IdentitySessionOptions): IdentitySessionOptions => {
    const maxSeconds = options.sessionMaxSeconds
    if (
        (maxSeconds !== null && maxSeconds <= 0) ||
        options.challengeTtlSeconds <= 0 ||
        options.challengeMaxAttempts < 1 ||
        options.sessionEncryptionKey.reveal().length < MIN_ENCRYPTION_KEY_LENGTH
    )
        throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable })
    return options
}

/** The absolute end a local maximum puts on a session, or null when there is no maximum. */
export const sessionCapEnd = (issuedAt: Date, maxSeconds: number | null): Date | null =>
    maxSeconds === null ? null : new Date(issuedAt.getTime() + maxSeconds * 1000)

/** The earlier of the provider's refresh expiry and the local maximum. */
export const sessionExpiry = (refreshExpiresAt: Date, issuedAt: Date, maxSeconds: number | null): Date => {
    const capEnd = sessionCapEnd(issuedAt, maxSeconds)
    return capEnd !== null && capEnd.getTime() < refreshExpiresAt.getTime() ? capEnd : refreshExpiresAt
}

/** True when the refresh token is close to its end and a refresh would still lengthen the session. */
export const refreshDue = (timing: SessionTiming, now: Date, maxSeconds: number | null): boolean => {
    const capEnd = sessionCapEnd(timing.issuedAt, maxSeconds)
    const closing = timing.refreshExpiresAt.getTime() - now.getTime() <= REFRESH_AHEAD_SECONDS * 1000
    return closing && (capEnd === null || timing.expiresAt.getTime() < capEnd.getTime())
}
