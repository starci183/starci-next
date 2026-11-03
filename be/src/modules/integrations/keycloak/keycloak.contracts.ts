/** The application-owned proof values sent to the authorization endpoint. */
export interface KeycloakAuthorization {
    /** One-use transaction state. */
    readonly state: string
    /** Token replay binding. */
    readonly nonce: string
    /** Base64url SHA-256 digest of the retained PKCE verifier. */
    readonly challenge: string
}

/** A claimed callback, exchanged exactly once by the identity capability. */
export interface KeycloakExchange {
    /** Transient authorization code; never returned to the application browser. */
    readonly code: string
    /** Retained S256 verifier. */
    readonly verifier: string
    /** Expected nonce from the claimed transaction. */
    readonly nonce: string
    /** Optional authorization-response issuer; a supplied issuer must match exactly. */
    readonly issuer?: string
}

/** Identity assertions returned only after signature and all registered-client claims are verified. */
export interface KeycloakIdentity {
    /** Verified provider issuer. */
    readonly issuer: string
    /** Verified account subject. */
    readonly subject: string
    /** Verified realm assertions; no learner role is required. */
    readonly roles: ReadonlyArray<string>
    /** Verified token expiry, which bounds the local session. */
    readonly expiresAt: Date
}

/** Validated discovery locations, all on the configured issuer's HTTPS origin. */
export interface KeycloakMetadata {
    /** Provider authorization endpoint. */
    readonly authorizationEndpoint: string
    /** Confidential code-exchange endpoint. */
    readonly tokenEndpoint: string
    /** Provider's public signature keys. */
    readonly jwksUri: string
    /** Browser RP-Initiated Logout endpoint. */
    readonly logoutEndpoint: string
}
