"use client"

import { usePostIdentitySignOutSwr } from "@/hooks/swr"
import { useGraphQLWithToast } from "@/modules/toast"

/** What useSignOut answers: the pending flag and the sign-out itself. */
export type SignOutHook = {
    readonly pending: boolean
    readonly signOut: (destination: string) => void
}

/**
 * Ends the reader's session through the sign-out door: whether the request runs and the sign-out itself. A failure is
 * reported by modules/toast; a success leaves for `destination` (the signed-out sign-in screen) with a full navigation, so
 * the next screen starts with no session in any cache.
 */
export const useSignOut = (): SignOutHook => {
    const withToast = useGraphQLWithToast()
    const { trigger, pending } = usePostIdentitySignOutSwr()
    const signOut = (destination: string): void => {
        void withToast(trigger, { showSuccessToast: false }).then((response) => {
            if (response.success) window.location.assign(destination)
        })
    }
    return { pending, signOut }
}
