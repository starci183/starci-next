"use client"

import { useEffect, useMemo } from "react"
import { hasSignInMark } from "@/modules/auth"
import { useSession } from "./useSession"

/**
 * Keeps a signed-in reader off the sign-in screen: once the session door has said the reader is signed in, it leaves once
 * (a full navigation, so every cache starts afresh) for `destination`, the validated `returnTo` or the home path. True only when
 * the form may be drawn: the reader is known to be signed out, or a read has just sent the reader here to sign in again (then the
 * form stays, so a read that the session does not satisfy never bounces between the two screens). `isGuarded` false (the sign-in
 * modal, which lives on a page the reader keeps) always draws the form and never leaves.
 */
export const useSignedInGuard = (destination: string, isGuarded: boolean): boolean => {
    const { status } = useSession()
    const isReauth = useMemo(() => hasSignInMark(), [])
    useEffect(() => {
        if (isGuarded && status === "signed-in" && !isReauth) window.location.replace(destination)
    }, [isGuarded, status, isReauth, destination])
    return !isGuarded || status === "signed-out" || (status === "signed-in" && isReauth)
}
