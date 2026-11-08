"use client"

import useSWRMutation from "swr/mutation"
import { verifyPasswordReset, type GraphQLResponse } from "@/modules/api"

/** Cache identity of the call; a mutation never reads it back. */
const MUTATE_IDENTITY_PASSWORD_RESET_VERIFY_SWR_KEY = "MUTATE_IDENTITY_PASSWORD_RESET_VERIFY_SWR"

/** What the call takes. */
type PostIdentityPasswordResetVerifyInput = {
    readonly challenge: string
    readonly code: string
    readonly password: string
}

/** The mutation arguments SWR hands the fetcher. */
type PostIdentityPasswordResetVerifyOptions = { readonly arg: PostIdentityPasswordResetVerifyInput }

/** What usePostIdentityPasswordResetVerifySwr answers: the call, which resolves with the one outcome, and whether it runs. */
type PostIdentityPasswordResetVerifyHook = {
    readonly trigger: (input: PostIdentityPasswordResetVerifyInput) => Promise<GraphQLResponse<null>>
    readonly pending: boolean
}

/** Sends the emailed code with the new password of a reset challenge. */
export const usePostIdentityPasswordResetVerifySwr = (): PostIdentityPasswordResetVerifyHook => {
    const { trigger, isMutating } = useSWRMutation(
        MUTATE_IDENTITY_PASSWORD_RESET_VERIFY_SWR_KEY,
        (_key: string, { arg }: PostIdentityPasswordResetVerifyOptions) =>
            verifyPasswordReset(arg.challenge, arg.code, arg.password),
    )
    return { trigger, pending: isMutating }
}
