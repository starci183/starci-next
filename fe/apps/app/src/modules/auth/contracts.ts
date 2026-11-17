/**
 * The signed-in reader as the session door verifies it: the verified subject of the identity assertion, the
 * roles the provider asserted and the instant the session expires (contract.identity.session-contract). The app never
 * holds tokens, credentials or provider detail: the session it reads is an opaque durable reference the back end owns.
 * The doors that open and close a session are the identity doors of modules/api/rest/identity, reached through their SWR hooks.
 */
export interface AuthSession {
    readonly userId: string
    /** The login name or display name the provider verified, or null. */
    readonly displayName: string | null
    /** The verified email, or null. */
    readonly email: string | null
    readonly roles: ReadonlyArray<string>
    readonly expiresAt: string
}
