import type { IdentityChallenge, SocialProvider } from "@/hooks/swr"

/** The three ways the sign-in screen takes a learner in; the emailed code step is shared by all of them. */
export type AuthMode = "signIn" | "signUp" | "forgot"

/** The step of the mode: the details form, or the six-digit code (and, for a reset, the new password). */
export type AuthStep = "details" | "code"

/** One-off notices above the form. */
export type AuthNotice =
    "signedOut" | "passwordReset" | "challengeExpired" | "socialFailed" | "unavailable" | "codeResent"

/** Why the form refuses, by the stable error code of the answer; the screen words each from the catalog. */
export type AuthProblem =
    | { readonly kind: "credentials" }
    | { readonly kind: "username" }
    | { readonly kind: "emailRegistered" }
    | { readonly kind: "password" }
    | { readonly kind: "mismatch" }
    | { readonly kind: "code"; readonly attemptsLeft: number | undefined }
    | { readonly kind: "codeShort" }
    | { readonly kind: "rateLimited"; readonly retryUntil: string | undefined }

/** Everything the screen draws that changes: mode, step, the open challenge, the notice and the refusal. */
export interface AuthState {
    readonly mode: AuthMode
    readonly step: AuthStep
    readonly challenge: IdentityChallenge | undefined
    readonly notice: AuthNotice | undefined
    readonly problem: AuthProblem | undefined
    readonly social: SocialProvider | undefined
}

/** The shortest password the sign-up and reset doors accept. */
export const PASSWORD_MIN_LENGTH = 6
/** The longest password the sign-up and reset doors accept. */
export const PASSWORD_MAX_LENGTH = 256

/** How long an emailed code stays valid (IDENTITY_CHALLENGE_TTL_SECONDS, 600 s). */
export const CODE_LIFETIME_MINUTES = 10

/** The digits of an emailed code. */
export const CODE_LENGTH = 6

/** The state a mode starts in; `notice` is the one-off notice the route brought. */
export const startState = (mode: AuthMode, notice: AuthNotice | undefined): AuthState => ({
    mode,
    step: "details",
    challenge: undefined,
    notice,
    problem: undefined,
    social: undefined,
})

/** The problem an answer's error code names, or undefined for a code the form has no words for. */
export const problemOf = (
    code: string,
    params: Readonly<Record<string, unknown>> | undefined,
): AuthProblem | undefined => {
    switch (code) {
        case "IDENTITY_CREDENTIALS_REJECTED":
            return { kind: "credentials" }
        case "IDENTITY_USERNAME_INVALID":
            return { kind: "username" }
        case "IDENTITY_EMAIL_REGISTERED":
            return { kind: "emailRegistered" }
        case "IDENTITY_PASSWORD_INVALID":
            return { kind: "password" }
        case "IDENTITY_CODE_MISMATCH": {
            const left = params?.attemptsLeft
            return { kind: "code", attemptsLeft: typeof left === "number" ? left : undefined }
        }
        case "HTTP_SECURITY_RATE_LIMITED": {
            const wait = params?.retryAfterSeconds
            const until = typeof wait === "number" ? new Date(Date.now() + wait * 1000).toISOString() : undefined
            return { kind: "rateLimited", retryUntil: until }
        }
        default:
            return undefined
    }
}

/** Whether a password is inside the doors' bounds. */
export const passwordFits = (password: string): boolean =>
    password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH

/** The text of a form field, or an empty string when the field is missing. */
export const fieldOf = (input: FormData, name: string): string => {
    const value = input.get(name)
    return typeof value === "string" ? value : ""
}

/** The change of state a refused answer causes: an expired challenge sends the learner back to the details, a known refusal marks the form, anything else is "unavailable". */
export const failurePatch = (
    code: string,
    params: Readonly<Record<string, unknown>> | undefined,
): Partial<AuthState> => {
    if (code === "IDENTITY_CHALLENGE_EXPIRED") {
        return { step: "details", challenge: undefined, notice: "challengeExpired", problem: undefined }
    }
    const problem = problemOf(code, params)
    return problem === undefined ? { notice: "unavailable", problem: undefined } : { problem, notice: undefined }
}
