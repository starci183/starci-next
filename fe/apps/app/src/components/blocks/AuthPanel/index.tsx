"use client"

import { useLocale, useTranslations } from "next-intl"
import { useState } from "react"
import {
    CODE_LIFETIME_MINUTES,
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    useAuthPanel,
    useSessionRefresh,
    useSignedInGuard,
    type AuthMode,
    type AuthState,
} from "@/hooks/auth"
import { fieldErrorsOf, noticeOf, retryOf, type Translator } from "@/hooks/authNotices"
import { useSignInModalStore } from "@/hooks/zustand/signInModal"
import { AuthPanelBase, type AuthPanelBaseProps, type AuthPanelShape } from "./component"

/** What the sign-in page hands the card: where it starts, the notice the route brought and where a finished sign-in goes. */
export type AuthPanelProps = {
    readonly mode: AuthMode
    readonly notice: AuthState["notice"]
    /** The path a finished sign-in goes to: the validated `returnTo` or the home path, already in the reader's locale. */
    readonly destination: string
    /** The validated `returnTo` the route carried, or undefined. */
    readonly returnTo: string | undefined
    /** `page` is the full sign-in screen (it leaves once signed in); `modal` sits on the reader's page and stays there. */
    readonly presentation: "page" | "modal"
}

/** The drawing of a state: the code step, or the details form of the mode. */
const shapeOf = (state: AuthState): AuthPanelShape => (state.step === "code" ? "code" : state.mode)

/** The words of a mode: title, support line, submit, and the line that switches to the other mode. */
const modeCopyOf = (mode: AuthMode, t: Translator) => ({
    title: t(`${mode}.title`),
    subtitle: t(`${mode}.subtitle`),
    submit: t(`${mode}.submit`),
    promptQuestion: t(`${mode}.promptQuestion`),
    promptAction: t(`${mode}.promptAction`),
})

/** The title, the support line and the switch-mode line of the state. */
const headingOf = (state: AuthState, t: Translator) => {
    const copy = modeCopyOf(state.mode, t)
    if (state.step === "details") return copy
    const email = state.challenge?.email
    const prompt = state.mode === "signUp" ? copy : modeCopyOf("forgot", t)
    return {
        title: t("code.title"),
        subtitle: email === undefined ? t("code.subtitleNoEmail") : t("code.subtitle", { email }),
        promptQuestion: prompt.promptQuestion,
        promptAction: prompt.promptAction,
    }
}

/** The labels the details form and the code form both draw on their password fields. */
const passwordLabelsOf = (t: Translator) => ({
    newPassword: t("field.newPassword"),
    confirm: t("field.confirm"),
    passwordHint: t("field.passwordHint", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }),
    passwordPlaceholder: t("field.passwordPlaceholder"),
    confirmPlaceholder: t("field.confirmPlaceholder"),
    reveal: t("field.reveal"),
    hide: t("field.hide"),
})

/** The words of the details form. */
const detailsLabelsOf = (state: AuthState, t: Translator): AuthPanelBaseProps["props"]["details"] => {
    const copy = modeCopyOf(state.mode, t)
    return {
        ...passwordLabelsOf(t),
        form: copy.title,
        identifier: t("field.identifier"),
        emailPlaceholder: t("field.emailPlaceholder"),
        email: t("field.email"),
        password: t("field.password"),
        terms: t("field.terms"),
        forgotLink: t("forgotLink"),
        submit: copy.submit,
    }
}

/** The words of the code form. */
const codeLabelsOf = (isReset: boolean, t: Translator): AuthPanelBaseProps["props"]["code"] => ({
    ...passwordLabelsOf(t),
    form: t("code.title"),
    code: t("code.label"),
    lifetime: t("code.lifetime", { minutes: CODE_LIFETIME_MINUTES }),
    submit: isReset ? t("code.submitReset") : t("code.submit"),
    resend: t("code.resend"),
    anotherEmail: t("code.anotherEmail"),
})

/** The card of the sign-in screen: its state machine over the identity doors, drawn by its pure twin. */
export const AuthPanel = (props: AuthPanelProps) => {
    const t = useTranslations("app.auth")
    const locale = useLocale()
    const refresh = useSessionRefresh()
    const setSignInOpen = useSignInModalStore((state) => state.setOpen)
    const panel = useAuthPanel({
        mode: props.mode,
        notice: props.notice,
        destination: props.destination,
        returnTo: props.returnTo,
        onSignedIn: () =>
            void refresh().then(() => {
                if (props.presentation === "modal") setSignInOpen(false)
            }),
    })
    const [isTermsAccepted, setIsTermsAccepted] = useState(false)
    const isSignedOut = useSignedInGuard(props.destination, props.presentation === "page")
    const { state } = panel
    const isReset = state.mode === "forgot"
    if (!isSignedOut) return null
    return (
        <AuthPanelBase
            shape={shapeOf(state)}
            props={{
                ...headingOf(state, t),
                isEmbedded: props.presentation === "modal",
                retry: retryOf(state, t, locale),
                ...fieldErrorsOf(state, t),
                notice: noticeOf(state, t),
                hasSocial: state.step === "details" && state.mode !== "forgot",
                social: {
                    facebookLabel: t("social.facebook"),
                    githubLabel: t("social.github"),
                    dividerLabel: t("social.or"),
                    pendingProvider: state.social,
                    pendingLabel:
                        state.social === undefined
                            ? ""
                            : t("social.redirecting", {
                                  provider:
                                      state.social === "facebook" ? t("social.facebookName") : t("social.githubName"),
                              }),
                },
                details: detailsLabelsOf(state, t),
                code: codeLabelsOf(isReset, t),
                isReset,
                isPending: panel.pending,
                isTermsAccepted,
                isRefused: state.problem?.kind === "credentials",
            }}
            on={{
                submitDetails: panel.submitDetails,
                submitCode: panel.submitCode,
                codeChange: panel.clearCodeProblem,
                resend: panel.resend,
                anotherEmail: panel.chooseAnotherEmail,
                forgot: () => panel.switchMode("forgot"),
                terms: setIsTermsAccepted,
                social: panel.startSocial,
                prompt: () =>
                    panel.switchMode(state.mode === "signIn" && state.step === "details" ? "signUp" : "signIn"),
            }}
        />
    )
}
