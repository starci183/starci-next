import { authErrorKey, PASSWORD_MIN_LENGTH } from "@starci/auth/client"

/** The three ways the sign-in screen takes a learner in: password sign-in, sign-up, and a password reset by emailed link. */
export type AuthMode = "signIn" | "signUp" | "forgot"

/** The step of the mode: the details form, or the note that the emailed link was sent. */
export type AuthStep = "details" | "sent"

/** One-off notices above the form. */
export type AuthNotice = "signedOut" | "passwordReset" | "linkResent" | "notConfirmed" | "socialFailed" | "unavailable"

/** Why the form refuses, by the stable error code of the answer; the screen words each from the catalog. */
export type AuthProblem =
    | { readonly kind: "credentials" }
    | { readonly kind: "email" }
    | { readonly kind: "password" }
    | { readonly kind: "mismatch" }
    | { readonly kind: "rateLimited" }
    /** Sign-up checks every field on submit: each flag marks a field that is wrong. */
    | { readonly kind: "fields"; readonly email: boolean; readonly password: boolean; readonly mismatch: boolean }

/** Everything the screen draws that changes: mode, step, the address the link went to, the notice and the refusal. */
export interface AuthState {
    readonly mode: AuthMode
    readonly step: AuthStep
    /** The address the emailed link was sent to, once the step is `sent`. */
    readonly sentTo: string | undefined
    readonly notice: AuthNotice | undefined
    readonly problem: AuthProblem | undefined
    /** True while the browser leaves for the social provider. */
    readonly isSocialPending: boolean
}

/** The shortest password the sign-up and reset doors accept (the edition's shared bound). */
export { PASSWORD_MIN_LENGTH }
/** The longest password the sign-up and reset doors accept, in bytes (bcrypt reads 72). */
export const PASSWORD_MAX_LENGTH = 72

/** The state a mode starts in; `notice` is the one-off notice the route brought. */
export const startState = (mode: AuthMode, notice: AuthNotice | undefined): AuthState => ({
    mode,
    step: "details",
    sentTo: undefined,
    notice,
    problem: undefined,
    isSocialPending: false,
})

/** The change of state a refused answer causes, read from its stable wire code: a known refusal marks the form, anything else is "unavailable". */
export const failurePatch = (code: string): Partial<AuthState> => {
    const key = authErrorKey(code)
    if (key === "errInvalidCredentials") return { problem: { kind: "credentials" }, notice: undefined }
    if (key === "errTooMany") return { problem: { kind: "rateLimited" }, notice: undefined }
    if (key === "errWeakPassword") return { problem: { kind: "password" }, notice: undefined }
    if (key === "errEmailNotConfirmed") return { notice: "notConfirmed", problem: undefined }
    return { notice: "unavailable", problem: undefined }
}

/** Whether a password is inside the doors' bounds. */
export const passwordFits = (password: string): boolean =>
    password.length >= PASSWORD_MIN_LENGTH && new TextEncoder().encode(password).length <= PASSWORD_MAX_LENGTH

/** The text of a form field, or an empty string when the field is missing. */
export const fieldOf = (input: FormData, name: string): string => {
    const value = input.get(name)
    return typeof value === "string" ? value : ""
}
