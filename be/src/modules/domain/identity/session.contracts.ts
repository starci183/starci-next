/** A cookie header or opaque credential may be absent for a signed-out caller. */
export type OptionalIdentityReference = string | undefined

/** The verified provider assertions an application session carries. */
export interface IdentityPrincipal {
    /** The exact configured issuer verified by the provider adapter. */
    readonly issuer: string
    /** The provider's stable subject. */
    readonly subject: string
    /** Roles asserted by the verified provider token, without inferred entitlement. */
    readonly roles: ReadonlyArray<string>
}

/** The authenticated read representation; no credential leaves this boundary. */
export interface IdentitySessionView {
    /** The verified provider assertions. */
    readonly identity: IdentityPrincipal
    /** The effective application expiry in RFC3339 UTC. */
    readonly expiresAt: string
}

/** A new browser-bound login transaction, before the browser visits the provider. */
export interface IdentityStart {
    /** The configured provider authorization destination. */
    readonly authorizationUrl: string
    /** The random binding issued only in the transaction cookie. */
    readonly binding: string
    /** The remaining transaction lifetime. */
    readonly maxAgeSeconds: number
}

/** Transient callback input, consumed only by the identity session lifecycle. */
export interface IdentityCallback {
    /** The provider-returned authorization state. */
    readonly state?: string | undefined
    /** The one-use authorization code. */
    readonly code?: string | undefined
    /** A provider refusal, never forwarded or logged. */
    readonly error?: string | undefined
    /** Optional authorization response issuer for mix-up prevention. */
    readonly issuer?: string | undefined
    /** The separate browser-binding cookie. */
    readonly binding?: string | undefined
    /** A previous session to revoke before replacing the browser's authentication. */
    readonly sessionReference?: string | undefined
}

/** The durable session created by a successful one-use callback. */
interface IdentityCallbackSuccess {
    /** A verified session has committed. */
    readonly kind: "success"
    /** Opaque credential issued only in a cookie. */
    readonly reference: string
    /** Whole seconds remaining before durable expiry. */
    readonly maxAgeSeconds: number
}

/** A consumed callback that must clear browser authentication. */
interface IdentityCallbackFailure {
    /** No session may be issued. */
    readonly kind: "error"
    /** Internal failure evidence, never forwarded to the app. */
    readonly cause?: unknown
}

/** A successful callback may issue one opaque reference; failures retain their internal cause only. */
export type IdentityCallbackResult = IdentityCallbackSuccess | IdentityCallbackFailure

/** Local revocation has completed before this provider navigation is returned. */
export interface IdentitySignOut {
    /** A provider logout destination or the fixed failure return. */
    readonly redirectUrl: string
    /** The internal provider failure, when logout discovery was unavailable. */
    readonly cause?: unknown
}
