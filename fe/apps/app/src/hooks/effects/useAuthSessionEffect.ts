"use client"

import { useEffect } from "react"
import { useGetIdentitySessionSwr } from "@/hooks/swr"
import { sessionChanged, useAppDispatch } from "@/redux"

/**
 * Keeps the redux session slice equal to the session the session door verifies: once the read settles it reports the
 * session the reader has now (undefined when signed out). A fresh navigation reads the door again.
 */
export const useAuthSessionEffect = (): void => {
    const dispatch = useAppDispatch()
    const { session, loading } = useGetIdentitySessionSwr()
    useEffect(() => {
        if (!loading) dispatch(sessionChanged(session))
    }, [dispatch, session, loading])
}
