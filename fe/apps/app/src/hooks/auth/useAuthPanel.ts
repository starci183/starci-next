"use client"

import { EMAIL_PATTERN } from "@starci/auth/client"
import { useLocale } from "next-intl"
import { useState } from "react"
import { usePostAuthDoorSwr, usePostAuthSignInSwr } from "@/hooks/swr"
import { apiUrl } from "@/modules/config"
import {
    failurePatch,
    fieldOf,
    passwordFits,
    startState,
    type AuthMode,
    type AuthNotice,
    type AuthState,
} from "./auth.shared"

/** What the panel starts from: its mode, the notice the route brought and where a finished sign-in goes. */
type AuthPanelInput = {
    readonly mode: AuthMode
    readonly notice: AuthNotice | undefined
    /** The validated path to return to, already locale-aware, or the home path. */
    readonly destination: string
    /** The validated `returnTo` the route carried, sent to the Google door, or undefined. */
    readonly returnTo: string | undefined
    /** What a finished sign-in does: the page refreshes the session and the guard leaves once; the modal refreshes and closes. */
    readonly onSignedIn: () => void
}

/** What useAuthPanel answers: the state to draw, whether a call runs and the actions of the screen. */
type AuthPanelHook = {
    readonly state: AuthState
    readonly pending: boolean
    readonly submitDetails: (input: FormData) => void
    readonly resend: () => void
    readonly chooseAnotherEmail: () => void
    readonly switchMode: (mode: AuthMode) => void
    readonly startGoogle: () => void
}

/**
 * The state machine of the sign-in screen over the auth doors of the back end: password sign-in keeps the session in place,
 * sign-up and password reset send an emailed link (the `sent` step), the link opens the confirm or reset page, and Google
 * sign-in leaves for the provider. Every refusal is read from the stable wire code of the answer, never the status.
 */
export const useAuthPanel = (input: AuthPanelInput): AuthPanelHook => {
    const language = useLocale() === "vi" ? "vi" : "en"
    const [state, setState] = useState<AuthState>(() => startState(input.mode, input.notice))
    const door = usePostAuthDoorSwr()
    const login = usePostAuthSignInSwr()
    const patch = (change: Partial<AuthState>): void => setState((current) => ({ ...current, ...change }))
    const signIn = async (email: string, password: string): Promise<void> => {
        const failure = await login.trigger({ email, password })
        if (failure === undefined) {
            input.onSignedIn()
            return
        }
        const change = failurePatch(failure.code)
        patch(change.notice === "notConfirmed" ? { ...change, step: "sent", sentTo: email } : change)
    }
    const send = async (name: "signup" | "forgot", body: Record<string, string>, email: string): Promise<void> => {
        const failure = await door.trigger({ door: name, body })
        patch(
            failure === undefined
                ? { step: "sent", sentTo: email, problem: undefined, notice: undefined }
                : failurePatch(failure.code),
        )
    }
    const submitDetails = (form: FormData): void => {
        const email = fieldOf(form, "email").trim().toLowerCase()
        const password = fieldOf(form, "password")
        patch({ problem: undefined, notice: undefined })
        if (!EMAIL_PATTERN.test(email)) patch({ problem: { kind: "email" } })
        else if (state.mode === "forgot") void send("forgot", { email, language }, email)
        else if (state.mode === "signIn") void signIn(email, password)
        else if (!passwordFits(password)) patch({ problem: { kind: "password" } })
        else if (password !== fieldOf(form, "confirm")) patch({ problem: { kind: "mismatch" } })
        else void send("signup", { email, password, language }, email)
    }
    const resend = (): void => {
        const email = state.sentTo
        if (email === undefined) return
        void door
            .trigger({ door: state.mode === "forgot" ? "forgot" : "resend", body: { email, language } })
            .then((failure) =>
                patch(
                    failure === undefined ? { notice: "linkResent", problem: undefined } : failurePatch(failure.code),
                ),
            )
    }
    const startGoogle = (): void => {
        patch({ isSocialPending: true, problem: undefined, notice: undefined })
        const next = input.returnTo === undefined ? "" : `?returnTo=${encodeURIComponent(input.returnTo)}`
        window.location.assign(`${apiUrl()}/auth/google${next}`)
    }
    return {
        state,
        pending: door.pending || login.pending,
        submitDetails,
        resend,
        chooseAnotherEmail: () => patch({ step: "details", sentTo: undefined, problem: undefined, notice: undefined }),
        switchMode: (mode) => setState(startState(mode, undefined)),
        startGoogle,
    }
}
