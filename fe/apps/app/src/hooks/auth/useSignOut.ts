"use client"

import { usePostAuthSignOutSwr } from "@/hooks/swr"

/** What useSignOut answers: the pending flag and the sign-out itself. */
export type SignOutHook = {
    readonly pending: boolean
    readonly signOut: (destination: string) => void
}

/**
 * Ends the reader's session through the logout door and leaves for `destination` (the signed-out sign-in screen) with a full
 * navigation, so the next screen starts with no session in any cache.
 */
export const useSignOut = (): SignOutHook => {
    const { trigger, pending } = usePostAuthSignOutSwr()
    const signOut = (destination: string): void => {
        void trigger().finally(() => window.location.assign(destination))
    }
    return { pending, signOut }
}
