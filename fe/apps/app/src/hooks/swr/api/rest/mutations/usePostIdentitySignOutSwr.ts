"use client"

import useSWRMutation from "swr/mutation"
import { signOutSession, type GraphQLResponse } from "@/modules/api"

/** Cache identity of the call; a mutation never reads it back. */
const MUTATE_IDENTITY_SIGN_OUT_SWR_KEY = "MUTATE_IDENTITY_SIGN_OUT_SWR"

/** What usePostIdentitySignOutSwr answers: the call, which resolves with the one outcome, and whether it runs. */
type PostIdentitySignOutHook = {
    readonly trigger: () => Promise<GraphQLResponse<null>>
    readonly pending: boolean
}

/** Ends the browser session. */
export const usePostIdentitySignOutSwr = (): PostIdentitySignOutHook => {
    const { trigger, isMutating } = useSWRMutation(MUTATE_IDENTITY_SIGN_OUT_SWR_KEY, () => signOutSession())
    return { trigger: () => trigger(), pending: isMutating }
}
