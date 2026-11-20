"use client"

import { isLinkInvalid } from "@starci/auth/client"
import { useState } from "react"
import { usePostAuthDoorSwr } from "@/hooks/swr"
import { fieldOf, passwordFits } from "./auth.shared"

/** What the reset card shows next to the form. */
export type ResetProblem = "password" | "mismatch" | "invalid" | "unavailable"

/** What useResetPassword answers: the refusal to draw, whether the call runs and the submit of the form. */
type ResetPasswordHook = {
    readonly problem: ResetProblem | undefined
    readonly pending: boolean
    readonly submit: (form: FormData) => void
}

/** The new-password form of the emailed reset link: checks the pair, sends it with the token, and leaves for `doneHref` once the back end set it. */
export const useResetPassword = (token: string | undefined, doneHref: string): ResetPasswordHook => {
    const hasToken = token !== undefined && token !== ""
    const [problem, setProblem] = useState<ResetProblem | undefined>(hasToken ? undefined : "invalid")
    const { trigger, pending } = usePostAuthDoorSwr()
    const submit = (form: FormData): void => {
        const password = fieldOf(form, "password")
        if (!passwordFits(password)) return setProblem("password")
        if (password !== fieldOf(form, "confirm")) return setProblem("mismatch")
        setProblem(undefined)
        void trigger({ door: "reset", body: { token, password } }).then((failure) => {
            if (failure === undefined) window.location.assign(doneHref)
            else setProblem(isLinkInvalid(failure.code) ? "invalid" : "unavailable")
        })
    }
    return { problem, pending, submit }
}
