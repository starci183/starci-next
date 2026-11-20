"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import {
    PASSWORD_MAX_LENGTH,
    PASSWORD_MIN_LENGTH,
    useAuthPanel,
    useSignedInGuard,
    type AuthMode,
    type AuthState,
} from "@/hooks/auth"
import { fieldErrorsOf, noticeOf, type Translator } from "@/hooks/authNotices"
import { googleSignInEnabled } from "@/modules/config"
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

/** The drawing of a state: the sent note, or the details form of the mode. */
const shapeOf = (state: AuthState): AuthPanelShape => (state.step === "sent" ? "sent" : state.mode)

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
    const email = state.sentTo ?? ""
    const prompt = state.mode === "forgot" ? modeCopyOf("forgot", t) : modeCopyOf("signUp", t)
    return {
        title: t("sent.title"),
        subtitle: t(state.mode === "forgot" ? "sent.subtitleReset" : "sent.subtitleConfirm", { email }),
        promptQuestion: prompt.promptQuestion,
        promptAction: prompt.promptAction,
    }
}

/** The words of the details form. */
const detailsLabelsOf = (state: AuthState, t: Translator): AuthPanelBaseProps["props"]["details"] => {
    const copy = modeCopyOf(state.mode, t)
    return {
        form: copy.title,
        email: t("field.email"),
        password: t("field.password"),
        newPassword: t("field.newPassword"),
        confirm: t("field.confirm"),
        passwordHint: t("field.passwordHint", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }),
        emailPlaceholder: t("field.emailPlaceholder"),
        passwordPlaceholder: t("field.passwordPlaceholder"),
        confirmPlaceholder: t("field.confirmPlaceholder"),
        reveal: t("field.reveal"),
        hide: t("field.hide"),
        terms: t("field.terms"),
        forgotLink: t("forgotLink"),
        submit: copy.submit,
    }
}

/** The card of the sign-in screen: its state machine over the auth doors, drawn by its pure twin. */
export const AuthPanel = (props: AuthPanelProps) => {
    const t = useTranslations("app.auth")
    const setSignInOpen = useSignInModalStore((state) => state.setOpen)
    const panel = useAuthPanel({
        mode: props.mode,
        notice: props.notice,
        destination: props.destination,
        returnTo: props.returnTo,
        // The session change remounts the viewer cache (every read starts afresh): the modal closes in place, the page leaves with a full navigation.
        onSignedIn: () => {
            if (props.presentation === "modal") setSignInOpen(false)
            else window.location.assign(props.destination)
        },
    })
    const [isTermsAccepted, setIsTermsAccepted] = useState(false)
    const isSignedOut = useSignedInGuard(props.destination, props.presentation === "page")
    const { state } = panel
    if (!isSignedOut) return null
    return (
        <AuthPanelBase
            shape={shapeOf(state)}
            props={{
                ...headingOf(state, t),
                isEmbedded: props.presentation === "modal",
                ...fieldErrorsOf(state, t),
                notice: noticeOf(state, t),
                hasSocial: googleSignInEnabled() && state.step === "details" && state.mode !== "forgot",
                social: {
                    googleLabel: t("social.google"),
                    dividerLabel: t("social.or"),
                    isPending: state.isSocialPending,
                    pendingLabel: t("social.redirecting", { provider: t("social.googleName") }),
                },
                details: detailsLabelsOf(state, t),
                sent: { resend: t("sent.resend"), anotherEmail: t("sent.anotherEmail") },
                isPending: panel.pending,
                isTermsAccepted,
                isRefused: state.problem?.kind === "credentials",
            }}
            on={{
                submitDetails: panel.submitDetails,
                resend: panel.resend,
                anotherEmail: panel.chooseAnotherEmail,
                forgot: () => panel.switchMode("forgot"),
                terms: setIsTermsAccepted,
                social: panel.startGoogle,
                prompt: () =>
                    panel.switchMode(state.mode === "signIn" && state.step === "details" ? "signUp" : "signIn"),
            }}
        />
    )
}
