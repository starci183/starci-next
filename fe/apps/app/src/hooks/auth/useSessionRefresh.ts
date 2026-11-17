"use client"

import { useSWRConfig } from "swr"

/** The cache identity of the verified-session read (hooks/swr useGetIdentitySessionSwr). */
const SESSION_READ_ID = "identity-session"

/** Re-reads the session in place, then every other read of the page, so a sign-in shows its effects without a navigation. */
export const useSessionRefresh = (): (() => Promise<void>) => {
    const { mutate } = useSWRConfig()
    return async (): Promise<void> => {
        await mutate(SESSION_READ_ID)
        await mutate(() => true)
    }
}
