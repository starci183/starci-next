/** Transient values consumed once at the registered callback; no client assertion grants authority. */
export interface SignInCallbackRequest {
    /** The one-use state returned by the provider. */
    readonly state?: string | undefined
    /** The single-use authorization code. */
    readonly code?: string | undefined
    /** A fixed refusal marker rather than provider prose. */
    readonly error?: string | undefined
    /** Optional provider response issuer. */
    readonly issuer?: string | undefined
    /** The separate browser transaction cookie. */
    readonly binding?: string | undefined
    /** A previous session revoked before browser authentication changes. */
    readonly sessionReference?: string | undefined
}
