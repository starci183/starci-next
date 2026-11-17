import type { GraphQLResponse } from "../../graphql"
import { postDoor, readNothing } from "./door"

/** The one-use challenge a sign-in, sign-up or password-reset door opens: the opaque reference and, when sent, the masked email. */
export interface IdentityChallenge {
    readonly challenge: string
    readonly email: string | undefined
}

/** Narrows `{ challenge, email?, expiresAt }` before it is read. */
const readChallenge = (data: unknown): IdentityChallenge | undefined => {
    if (typeof data !== "object" || data === null || !("challenge" in data) || typeof data.challenge !== "string") {
        return undefined
    }
    const email = "email" in data && typeof data.email === "string" ? data.email : undefined
    return { challenge: data.challenge, email }
}

/** Checks the identifier and password; a success opens the sign-in challenge and sends the code. */
export const signIn = (identifier: string, password: string): Promise<GraphQLResponse<IdentityChallenge>> =>
    postDoor("/api/identity/sign-in", { identifier, password }, readChallenge)

/** Sends the emailed code of a sign-in challenge; a success sets the session cookie. */
export const verifySignIn = (challenge: string, code: string): Promise<GraphQLResponse<null>> =>
    postDoor("/api/identity/sign-in/verify", { challenge, code }, readNothing)

/** Creates the account and opens the sign-up challenge. */
export const signUp = (email: string, password: string): Promise<GraphQLResponse<IdentityChallenge>> =>
    postDoor("/api/identity/sign-up", { email, password, acceptTerms: true }, readChallenge)

/** Sends the emailed code of a sign-up challenge; a success sets the session cookie. */
export const verifySignUp = (challenge: string, code: string): Promise<GraphQLResponse<null>> =>
    postDoor("/api/identity/sign-up/verify", { challenge, code }, readNothing)

/** Opens a password-reset challenge; the answer is the same for a registered and an unknown email. */
export const requestPasswordReset = (email: string): Promise<GraphQLResponse<IdentityChallenge>> =>
    postDoor("/api/identity/password-reset", { email }, readChallenge)

/** Sends the emailed code with the new password of a password-reset challenge. */
export const verifyPasswordReset = (
    challenge: string,
    code: string,
    password: string,
): Promise<GraphQLResponse<null>> =>
    postDoor("/api/identity/password-reset/verify", { challenge, code, password }, readNothing)

/** Sends a new code for a live challenge. */
export const resendCode = (challenge: string): Promise<GraphQLResponse<null>> =>
    postDoor("/api/identity/challenge/resend", { challenge }, readNothing)
