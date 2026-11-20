"use client"

import { useSWRConfig } from "swr"

/** Re-reads every read of the page, so a sign-in shows its effects without a navigation (the session itself is kept by the auth client and reported to the app by the auth session effect). */
export const useSessionRefresh = (): (() => Promise<void>) => {
    const { mutate } = useSWRConfig()
    return async (): Promise<void> => {
        await mutate(() => true)
    }
}
