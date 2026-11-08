"use client"

import { useState } from "react"
import type { GraphQLResponse, IdentityChallenge, SocialProvider } from "@/hooks/swr"
import {
    CODE_LENGTH,
    failurePatch,
    fieldOf,
    passwordFits,
    startState,
    type AuthMode,
    type AuthNotice,
    type AuthState,
} from "./auth.shared"
import { useChallengeClosers } from "./useChallengeClosers"
import { useChallengeOpeners } from "./useChallengeOpeners"

/** What the panel starts from: its mode, the notice the route brought and where a finished sign-in goes. */
type AuthPanelInput = {
    readonly mode: AuthMode
    readonly notice: AuthNotice | undefined
    /** The validated path to return to, already locale-aware, or the home path. */
    readonly destination: string
    /** The validated `returnTo` the route carried, sent to the social door, or undefined. */
    readonly returnTo: string | undefined
    /** What a finished sign-in does: the page refreshes the session and the guard leaves once; the modal refreshes and closes. */
    readonly onSignedIn: () => void
}

/** What useAuthPanel answers: the state to draw, whether a call runs and the actions of the screen. */
type AuthPanelHook = {
    readonly state: AuthState
    readonly pending: boolean
    readonly submitDetails: (input: FormData) => void
    readonly submitCode: (input: FormData) => void
    readonly clearCodeProblem: () => void
    readonly resend: () => void
    readonly chooseAnotherEmail: () => void
    readonly switchMode: (mode: AuthMode) => void
    readonly startSocial: (provider: SocialProvider) => void
}

/** Leaves the screen with a full navigation, so the new session starts every cache of the app afresh. */
const leaveTo = (href: string): void => window.location.assign(href)

/**
 * The state machine of the sign-in screen over the identity doors: sign-in, sign-up and password reset each open a challenge,
 * the code step closes it, and social sign-in leaves for the provider. Every refusal is read from the stable error code of the
 * answer, never the status. A success of the code step hands over to `onSignedIn`; a reset returns to the sign-in details.
 */
export const useAuthPanel = (input: AuthPanelInput): AuthPanelHook => {
    const [state, setState] = useState<AuthState>(() => startState(input.mode, input.notice))
    const open = useChallengeOpeners()
    const close = useChallengeClosers()
    const patch = (change: Partial<AuthState>): void => setState((current) => ({ ...current, ...change }))
    const fail = (response: GraphQLResponse<unknown>): void => {
        if (!response.success) patch(failurePatch(response.error, response.params))
    }
    const openCode = (response: GraphQLResponse<IdentityChallenge>): void => {
        if (response.success) patch({ step: "code", challenge: response.data, problem: undefined, notice: undefined })
        else fail(response)
    }
    const submitDetails = (form: FormData): void => {
        const email = fieldOf(form, "email")
        const password = fieldOf(form, "password")
        patch({ problem: undefined, notice: undefined })
        if (state.mode === "signIn") void open.signIn(email, password).then(openCode)
        else if (state.mode === "forgot") void open.reset(email).then(openCode)
        else if (!passwordFits(password)) patch({ problem: { kind: "password" } })
        else if (password !== fieldOf(form, "confirm")) patch({ problem: { kind: "mismatch" } })
        else void open.signUp(email, password).then(openCode)
    }
    const finish = (response: GraphQLResponse<null>): void => {
        if (response.success) input.onSignedIn()
        else fail(response)
    }
    const submitReset = (form: FormData, challenge: string, code: string): void => {
        const password = fieldOf(form, "password")
        if (!passwordFits(password)) patch({ problem: { kind: "password" } })
        else if (password !== fieldOf(form, "confirm")) patch({ problem: { kind: "mismatch" } })
        else
            void close.verifyReset(challenge, code, password).then((response) => {
                if (response.success) setState(startState("signIn", "passwordReset"))
                else fail(response)
            })
    }
    const submitCode = (form: FormData): void => {
        const code = fieldOf(form, "code")
        const challenge = state.challenge?.challenge
        if (challenge === undefined) return
        patch({ problem: undefined, notice: undefined })
        if (code.length !== CODE_LENGTH) patch({ problem: { kind: "codeShort" } })
        else if (state.mode === "signIn") void close.verifySignIn(challenge, code).then(finish)
        else if (state.mode === "signUp") void close.verifySignUp(challenge, code).then(finish)
        else submitReset(form, challenge, code)
    }
    const resend = (): void => {
        const challenge = state.challenge?.challenge
        if (challenge === undefined) return
        void close.resend(challenge).then((response) => {
            if (response.success) patch({ notice: "codeResent", problem: undefined })
            else fail(response)
        })
    }
    const startSocial = (provider: SocialProvider): void => {
        patch({ social: provider, problem: undefined, notice: undefined })
        void open.social(provider, input.returnTo).then((response) => {
            if (response.success) leaveTo(response.data)
            else patch({ social: undefined, notice: "unavailable" })
        })
    }
    return {
        state,
        pending: open.pending || close.pending,
        submitDetails,
        submitCode,
        clearCodeProblem: () =>
            setState((current) =>
                current.problem?.kind === "code" || current.problem?.kind === "codeShort"
                    ? { ...current, problem: undefined }
                    : current,
            ),
        resend,
        chooseAnotherEmail: () =>
            patch({ step: "details", challenge: undefined, problem: undefined, notice: undefined }),
        switchMode: (mode) => setState(startState(mode, undefined)),
        startSocial,
    }
}
