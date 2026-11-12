import type { useTranslations } from "next-intl"
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, type AuthState } from "@/hooks/auth"
import type { AuthNoticeTone, AuthRetry, FieldErrors } from "@/modules/types"

/** The translator of the sign-in catalog namespace. */
export type Translator = ReturnType<typeof useTranslations<"app.auth">>

/** The tone each one-off notice is drawn in. */
const NOTICE_TONES = {
    signedOut: "affirmative",
    passwordReset: "affirmative",
    codeResent: "affirmative",
    challengeExpired: "cautionary",
    socialFailed: "negative",
    unavailable: "negative",
} as const satisfies Record<NonNullable<AuthState["notice"]>, AuthNoticeTone>

/** The notice above the form: a refused credential pair first, then the one-off notice of the state. */
export const noticeOf = (
    state: AuthState,
    t: Translator,
): { readonly tone: AuthNoticeTone; readonly title: string } | undefined => {
    if (state.problem?.kind === "credentials") return { tone: "negative", title: t("notice.credentials") }
    if (state.problem?.kind === "rateLimited") {
        return {
            tone: "cautionary",
            title: t("notice.rateLimited"),
        }
    }
    if (state.notice === undefined) return undefined
    return { tone: NOTICE_TONES[state.notice], title: t(`notice.${state.notice}`) }
}

/** The message under the code field: the attempts left when the answer said so. */
const codeErrorOf = (problem: AuthState["problem"], t: Translator): string | undefined => {
    if (problem?.kind === "codeShort") return t("error.codeShort")
    if (problem?.kind !== "code") return undefined
    return problem.attemptsLeft === undefined
        ? t("error.code")
        : t("error.codeAttempts", { count: problem.attemptsLeft })
}

/** The message under the email field: a refused username, or an email that already has an account. */
const emailErrorOf = (problem: AuthState["problem"], t: Translator): string | undefined => {
    if (problem?.kind === "username") return t("error.username")
    return problem?.kind === "emailRegistered" ? t("error.emailRegistered") : undefined
}

/** The message under each field, from the problem of the last refusal. */
export const fieldErrorsOf = (state: AuthState, t: Translator): FieldErrors => ({
    emailError: emailErrorOf(state.problem, t),
    passwordError:
        state.problem?.kind === "password"
            ? t("error.password", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
            : undefined,
    confirmError: state.problem?.kind === "mismatch" ? t("error.mismatch") : undefined,
    codeError: codeErrorOf(state.problem, t),
})

/** The wait a rate-limited answer named: the instant it ends and the words around its countdown, or undefined when no wait applies. */
export const retryOf = (state: AuthState, t: Translator, locale: string): AuthRetry | undefined => {
    if (state.problem?.kind !== "rateLimited" || state.problem.retryUntil === undefined) return undefined
    return {
        until: state.problem.retryUntil,
        locale,
        template: t("notice.rateLimitedIn"),
        expired: t("notice.rateLimitedOver"),
    }
}
