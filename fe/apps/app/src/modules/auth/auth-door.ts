import axios from "axios"
import type { AuthSession } from "./contracts"

/**
 * The application-owned doors of the identity session contract (contract.identity.session-contract): the browser posts
 * `signIn` to start the provider handshake and `signOut` to end it — each answers 303, which only a browser navigation
 * may follow — and `session` is the GET door that reads the verified session. These are transport paths owned here, in
 * the one auth door of the app (FE-TRANSPORT-OWNER); they are never internal navigation destinations.
 */
export const AUTH_DOORS = {
    session: "/api/identity/session",
    signIn: "/api/identity/session/start",
    signOut: "/api/identity/session/sign-out",
} as const

/** The REST client of the auth door alone: same-origin, bounded by the session contract's outbound budget. */
const door = axios.create({
    timeout: 10_000,
    validateStatus: () => true,
})

/** The JSON a `GET /api/identity/session` success carries: the verified identity view and the session expiry. */
interface SessionBody {
    readonly identity: {
        readonly issuer: string
        readonly subject: string
        readonly roles: ReadonlyArray<string>
    }
    readonly expiresAt: string
}

/** Narrows the session door's answer before it is read: the wire shape is checked, never trusted as `any`. */
const isSessionBody = (value: unknown): value is SessionBody => {
    if (typeof value !== "object" || value === null || !("identity" in value) || !("expiresAt" in value)) return false
    const { identity, expiresAt } = value
    if (typeof identity !== "object" || identity === null) return false
    if (!("issuer" in identity) || !("subject" in identity) || !("roles" in identity)) return false
    const { issuer, subject } = identity
    const roles: unknown = identity.roles
    if (typeof issuer !== "string" || typeof subject !== "string" || !Array.isArray(roles) || typeof expiresAt !== "string") {
        return false
    }
    return roles.every((role: unknown) => typeof role === "string")
}

/**
 * Reads the reader's session through the session door: the verified identity on `200`, undefined on the explicit
 * `401 IDENTITY_SESSION_REQUIRED` (signed out, expired or revoked — the door also clears the cookies) or on any other
 * refusal or transport failure, which reads the same way to the session vocabulary.
 */
export const readSession = async (): Promise<AuthSession | undefined> => {
    try {
        const response = await door.get<unknown>(AUTH_DOORS.session)
        if (response.status !== 200 || !isSessionBody(response.data)) return undefined
        const { identity } = response.data
        return { userId: identity.subject, issuer: identity.issuer, roles: identity.roles, expiresAt: response.data.expiresAt }
    } catch {
        return undefined
    }
}
