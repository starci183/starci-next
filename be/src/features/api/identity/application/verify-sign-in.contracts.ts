/** Values the verify-sign-in door passes on; the domain decides what they mean. */
export interface VerifySignInRequest {
    /** The opaque challenge the sign-in answered. */
    readonly challenge: string
    /** The six-digit emailed code. */
    readonly code: string
}
