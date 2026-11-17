"use client"

import useSWRMutation from "swr/mutation"
import { requestPasswordReset, type GraphQLResponse, type IdentityChallenge } from "@/modules/api"

/** Cache identity of the call; a mutation never reads it back. */
const MUTATE_IDENTITY_PASSWORD_RESET_SWR_KEY = "MUTATE_IDENTITY_PASSWORD_RESET_SWR"

/** What the call takes. */
type PostIdentityPasswordResetInput = { readonly email: string }

/** The mutation arguments SWR hands the fetcher. */
type PostIdentityPasswordResetOptions = { readonly arg: PostIdentityPasswordResetInput }

/** What usePostIdentityPasswordResetSwr answers: the call, which resolves with the one outcome, and whether it runs. */
type PostIdentityPasswordResetHook = {
    readonly trigger: (input: PostIdentityPasswordResetInput) => Promise<GraphQLResponse<IdentityChallenge>>
    readonly pending: boolean
}

/** Opens a password-reset challenge. */
export const usePostIdentityPasswordResetSwr = (): PostIdentityPasswordResetHook => {
    const { trigger, isMutating } = useSWRMutation(
        MUTATE_IDENTITY_PASSWORD_RESET_SWR_KEY,
        (_key: string, { arg }: PostIdentityPasswordResetOptions) => requestPasswordReset(arg.email),
    )
    return { trigger, pending: isMutating }
}
