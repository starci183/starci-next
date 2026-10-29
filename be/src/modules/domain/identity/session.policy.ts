import { createHash, randomBytes } from "node:crypto"
import { IdentityError, IdentityErrorCode } from "./errors/identity.error"
import type { IdentitySessionOptions } from "./identity.options"

/** The only application authentication cookie. */
export const IDENTITY_SESSION_COOKIE = "__Host-identity_session"

/** The separate one-use login browser binding. */
export const IDENTITY_LOGIN_COOKIE = "__Host-identity_login"

/** Mints 256 unpredictable bits for one protocol value or opaque session reference. */
export const randomReference = (): string => randomBytes(32).toString("base64url")

/** Stores only a one-way digest of a browser credential or transient state. */
export const referenceDigest = (reference: string): string => createHash("sha256").update(reference).digest("hex")

/** Builds the S256 challenge sent instead of the confidential verifier. */
export const pkceChallenge = (verifier: string): string => createHash("sha256").update(verifier).digest("base64url")

/** Accepts only the fixed-length credential this capability mints. */
export const validReference = (reference: string | undefined): reference is string =>
    reference !== undefined && /^[A-Za-z0-9_-]{43}$/.test(reference)

/** Refuses nonpositive local lifetimes before state can be issued. */
export const validateIdentityLifetimes = (options: IdentitySessionOptions): IdentitySessionOptions => {
    if (options.sessionMaxSeconds <= 0 || options.transactionTtlSeconds <= 0)
        throw new IdentityError({ code: IdentityErrorCode.SessionUnavailable })
    return options
}
