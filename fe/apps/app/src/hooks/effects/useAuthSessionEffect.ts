"use client"

import { useEffect } from "react"
import { subscribeToSession } from "@/modules/auth-session"
import { sessionChanged, useAppDispatch } from "@/redux"

/**
 * Keeps the redux session slice equal to the session the auth client holds: it reports the first answer (a refresh through the
 * refresh cookie), then every sign-in, sign-out and token refresh (undefined when signed out).
 */
export const useAuthSessionEffect = (): void => {
    const dispatch = useAppDispatch()
    useEffect(() => subscribeToSession((session) => dispatch(sessionChanged(session))), [dispatch])
}
