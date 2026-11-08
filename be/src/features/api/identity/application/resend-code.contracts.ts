/** Values the resend-code door passes on; the domain decides what they mean. */
export interface ResendCodeRequest {
    /** The opaque challenge to send a new code for. */
    readonly challenge: string
}
