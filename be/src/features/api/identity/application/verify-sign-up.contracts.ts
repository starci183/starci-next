/** Values the verify-sign-up door passes on; the domain decides what they mean. */
export interface VerifySignUpRequest {
    /** The opaque challenge the sign-up answered. */
    readonly challenge: string
    /** The six-digit emailed code. */
    readonly code: string
}
