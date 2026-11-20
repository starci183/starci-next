"use client"

import useSWRMutation from "swr/mutation"
import { endSession } from "@/modules/auth-session"

/** Cache identity of the call; a mutation never reads it back. */
const POST_AUTH_SIGN_OUT_SWR_KEY = "POST_AUTH_SIGN_OUT_SWR"

/** What usePostAuthSignOutSwr answers: the call, which resolves once the session is over, and whether it runs. */
type PostAuthSignOutHook = {
    readonly trigger: () => Promise<void>
    readonly pending: boolean
}

/** Ends the session through the logout door (the cookie is cleared, the token is forgotten here even when the door cannot be reached). */
export const usePostAuthSignOutSwr = (): PostAuthSignOutHook => {
    const { trigger, isMutating } = useSWRMutation(POST_AUTH_SIGN_OUT_SWR_KEY, () => endSession())
    return { trigger: () => trigger(), pending: isMutating }
}
