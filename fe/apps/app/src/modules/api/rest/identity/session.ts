import axios from "axios"
import type { GraphQLResponse } from "../../graphql"
import { postDoor, readNothing } from "./door"

/** The GET door that reads the verified session (contract.identity.session-contract); a transport path, never a navigation destination. */
const SESSION_DOOR = "/api/identity/session"

/** The REST client of the identity session door: same-origin, bounded by the session contract's outbound budget. */
const door = axios.create({
    timeout: 10_000,
    validateStatus: () => true,
})

/** The verified reader as the session door answers it; structurally the AuthSession the redux session slice holds. */
export interface IdentitySession {
    readonly userId: string
    /** The login name or display name the provider verified, or null when the session carries none. */
    readonly displayName: string | null
    /** The verified email, or null when the session carries none. */
    readonly email: string | null
    readonly roles: ReadonlyArray<string>
    readonly expiresAt: string
}

/** The JSON a `GET /api/identity/session` success carries: the verified identity view and the session expiry. */
interface SessionBody {
    readonly identity: {
        readonly subject: string
        readonly roles: ReadonlyArray<string>
        readonly displayName?: unknown
        readonly email?: unknown
    }
    readonly expiresAt: string
}

/** Narrows the session door's answer before it is read: the wire shape is checked, never trusted as `any`. */
const isSessionBody = (value: unknown): value is SessionBody => {
    if (typeof value !== "object" || value === null || !("identity" in value) || !("expiresAt" in value)) return false
    const { identity, expiresAt } = value
    if (typeof identity !== "object" || identity === null) return false
    if (!("subject" in identity) || !("roles" in identity)) return false
    const { subject } = identity
    const roles: unknown = identity.roles
    if (typeof subject !== "string" || !Array.isArray(roles) || typeof expiresAt !== "string") {
        return false
    }
    return roles.every((role: unknown) => typeof role === "string")
}

/** A text the door sent, or null when it sent none (or anything else). */
const textOrNull = (value: unknown): string | null => (typeof value === "string" && value !== "" ? value : null)

/**
 * Reads the reader's session through the session door: the verified identity on `200`, undefined on the explicit
 * `401 IDENTITY_SESSION_REQUIRED` (signed out, expired or revoked — the door also clears the cookies) or on any other
 * refusal or transport failure, which reads the same way to the session vocabulary.
 */
export const readSession = async (): Promise<IdentitySession | undefined> => {
    try {
        const response = await door.get<unknown>(SESSION_DOOR)
        if (response.status !== 200 || !isSessionBody(response.data)) return undefined
        const { identity } = response.data
        return {
            userId: identity.subject,
            displayName: textOrNull(identity.displayName),
            email: textOrNull(identity.email),
            roles: identity.roles,
            expiresAt: response.data.expiresAt,
        }
    } catch {
        return undefined
    }
}

/** Ends the session: the door clears the cookie and answers success even for an expired session. */
export const signOutSession = (): Promise<GraphQLResponse<null>> =>
    postDoor("/api/identity/session/sign-out", undefined, readNothing)
