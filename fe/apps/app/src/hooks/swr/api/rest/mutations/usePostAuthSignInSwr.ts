"use client"

import useSWRMutation from "swr/mutation"
import type { AuthFailure } from "@/modules/auth"
import { signInWithPassword } from "@/modules/auth-session"

/** Cache identity of the call; a mutation never reads it back. */
const POST_AUTH_SIGN_IN_SWR_KEY = "POST_AUTH_SIGN_IN_SWR"

/** What one sign-in takes. */
export type AuthSignInArgument = { readonly email: string; readonly password: string }

/** The extra argument SWR hands the fetcher. */
type AuthSignInExtra = { readonly arg: AuthSignInArgument }

/** What usePostAuthSignInSwr answers: the call, which resolves with the failure the door answered (undefined when the session opened), and whether it runs. */
type PostAuthSignInHook = {
    readonly trigger: (argument: AuthSignInArgument) => Promise<AuthFailure | undefined>
    readonly pending: boolean
}

/** Signs in with email and password through the login door; the auth client keeps the access token and announces the session. */
export const usePostAuthSignInSwr = (): PostAuthSignInHook => {
    const { trigger, isMutating } = useSWRMutation(POST_AUTH_SIGN_IN_SWR_KEY, (_key: string, extra: AuthSignInExtra) =>
        signInWithPassword(extra.arg.email, extra.arg.password),
    )
    return { trigger: (argument) => trigger(argument), pending: isMutating }
}
