import type { useTranslations } from "next-intl"
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, type AuthState } from "@/hooks/auth"
import type { AuthNoticeTone, FieldErrors } from "@/modules/types"

/** The translator of the sign-in catalog namespace. */
export type Translator = ReturnType<typeof useTranslations<"app.auth">>

/** The tone each one-off notice is drawn in. */
const NOTICE_TONES = {
    signedOut: "affirmative",
    passwordReset: "affirmative",
    linkResent: "affirmative",
    notConfirmed: "cautionary",
    socialFailed: "negative",
    unavailable: "negative",
} as const satisfies Record<NonNullable<AuthState["notice"]>, AuthNoticeTone>

/** The notice above the form: a refused credential pair or a throttled sign-in first, then the one-off notice of the state. */
export const noticeOf = (
    state: AuthState,
    t: Translator,
): { readonly tone: AuthNoticeTone; readonly title: string } | undefined => {
    if (state.problem?.kind === "credentials") return { tone: "negative", title: t("notice.credentials") }
    if (state.problem?.kind === "rateLimited") return { tone: "cautionary", title: t("notice.rateLimited") }
    if (state.notice === undefined) return undefined
    return { tone: NOTICE_TONES[state.notice], title: t(`notice.${state.notice}`) }
}

/** The message under each field, from the problem of the last refusal. */
export const fieldErrorsOf = (state: AuthState, t: Translator): FieldErrors => ({
    emailError: state.problem?.kind === "email" ? t("error.email") : undefined,
    passwordError:
        state.problem?.kind === "password"
            ? t("error.password", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })
            : undefined,
    confirmError: state.problem?.kind === "mismatch" ? t("error.mismatch") : undefined,
})
