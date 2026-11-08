/** The body the password-reset door answers; it carries no token, password or code. */
export interface PasswordResetResponse {
    /** The opaque reset challenge. */
    readonly challenge: string

    /** When the challenge stops accepting codes, RFC3339. */
    readonly expiresAt: string
}
