/** One currently active session as the store holds it. */
export interface IdentitySessionRow {
    /** The verified stable subject. */
    readonly subject: string
    /** Roles copied only from the verified token. */
    readonly roles: Array<string>
    /** The cleaned display name from the verified token; null for a session issued without one. */
    readonly display_name: string | null
    /** The cleaned email from the verified token; null for a session issued without one. */
    readonly email: string | null
    /** The provider refresh token, sealed. */
    readonly refresh_ciphertext: string
    /** When the refresh token stops working. */
    readonly refresh_expires_at: Date
    /** The effective end of the session. */
    readonly expires_at: Date
    /** When the session was created. */
    readonly issued_at: Date
}

/** The sealed refresh token of a session that this statement just revoked. */
export interface RevokedSessionRow {
    /** The provider refresh token, sealed. */
    readonly refresh_ciphertext: string
}

/** The new expiry of a session whose tokens were just rotated. */
export interface RotatedSessionRow {
    /** The effective end of the session. */
    readonly expires_at: Date
}
