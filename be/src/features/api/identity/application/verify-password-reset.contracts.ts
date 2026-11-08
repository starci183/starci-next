/** Values the verify-password-reset door passes on; the domain decides what they mean. */
export interface VerifyPasswordResetRequest {
    /** The opaque reset challenge. */
    readonly challenge: string
    /** The six-digit emailed code. */
    readonly code: string
    /** The new password. */
    readonly password: string
}
