import { fakeIds } from "@starci/jest-preset"

/** The host-only session cookie as the doors set it. */
export const SESSION_COOKIE: RegExp =
    /^__Host-identity_session=[A-Za-z0-9_-]{43}; Path=\/; Secure; HttpOnly; SameSite=Lax; Max-Age=\d+$/u

/** The exact cookie that clears the session. */
export const SESSION_DELETED: string =
    "__Host-identity_session=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT"

/** A credential for the cookie of a session that was never issued. */
export const UNKNOWN_COOKIE: string = `__Host-identity_session=${"r".repeat(43)}`

/** The challenge a sign-in or sign-up door answers. */
export interface ChallengeBody {
    readonly challenge: string
    readonly email: string
    readonly expiresAt: string
}

/** The body of a refusal as the common filter writes it. */
export interface RefusalBody {
    readonly code: string
    readonly kind: string
    readonly params: Readonly<Record<string, string | number>>
}

/** The provider-asserted principal of a session read. */
export interface PrincipalBody {
    readonly subject: string
    readonly roles: ReadonlyArray<string>
    /** The name the header shows, or null when the session was issued without one. */
    readonly displayName: string | null
    /** The learner's email, or null when the session was issued without one. */
    readonly email: string | null
}

/** The body of the current-session door. */
export interface SessionBody {
    readonly identity: PrincipalBody
    readonly expiresAt: string
}

/** The body of the social start door. */
export interface SocialStartBody {
    readonly authorizationUrl: string
}

/** The body of the social exchange door. */
export interface SocialExchangeBody {
    readonly returnTo: string
}

/** An account of the identity provider realm. */
export interface Learner {
    readonly username: string
    readonly email: string
    readonly password: string
}

/** A source of learners that never repeats a name, so tests of one file never share an account. */
export const learnersOf = (prefix: string): (() => Learner) => {
    const ids = fakeIds(prefix)
    return () => {
        const id = ids.next().toLowerCase()
        return { username: id, email: `${id}@starci.test`, password: `${id}-passphrase` }
    }
}

/** The keys of a body in a stable order. */
export const keysOf = (body: object): Array<string> => Object.keys(body).sort((a, b) => a.localeCompare(b))
