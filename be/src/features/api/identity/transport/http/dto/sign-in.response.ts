/** The body the sign-in door answers; it carries no token, password or code. */
export interface SignInResponse {
    /** The opaque challenge to send with the code. */
    readonly challenge: string

    /** The masked email the code went to. */
    readonly email: string

    /** When the challenge stops accepting codes, RFC3339. */
    readonly expiresAt: string
}
