/** The one-use material returned only to the winner of a state claim. */
export interface LoginTransactionRow {
    /** The provider nonce expected after exchange. */
    readonly nonce: string
    /** The confidential PKCE verifier. */
    readonly verifier: string
}

/** Durable verified assertions from one currently active session. */
export interface IdentitySessionRow {
    /** The exact verified provider issuer. */
    readonly issuer: string
    /** The verified stable subject. */
    readonly subject: string
    /** Roles copied only from the verified token. */
    readonly roles: Array<string>
    /** The earlier local and provider expiry. */
    readonly expires_at: Date
}
