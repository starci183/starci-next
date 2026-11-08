"use client"

import useSWRMutation from "swr/mutation"
import { resendCode, type GraphQLResponse } from "@/modules/api"

/** Cache identity of the call; a mutation never reads it back. */
const MUTATE_IDENTITY_CHALLENGE_RESEND_SWR_KEY = "MUTATE_IDENTITY_CHALLENGE_RESEND_SWR"

/** What the call takes. */
type PostIdentityChallengeResendInput = { readonly challenge: string }

/** The mutation arguments SWR hands the fetcher. */
type PostIdentityChallengeResendOptions = { readonly arg: PostIdentityChallengeResendInput }

/** What usePostIdentityChallengeResendSwr answers: the call, which resolves with the one outcome, and whether it runs. */
type PostIdentityChallengeResendHook = {
    readonly trigger: (input: PostIdentityChallengeResendInput) => Promise<GraphQLResponse<null>>
    readonly pending: boolean
}

/** Asks for a new code of a live challenge. */
export const usePostIdentityChallengeResendSwr = (): PostIdentityChallengeResendHook => {
    const { trigger, isMutating } = useSWRMutation(
        MUTATE_IDENTITY_CHALLENGE_RESEND_SWR_KEY,
        (_key: string, { arg }: PostIdentityChallengeResendOptions) => resendCode(arg.challenge),
    )
    return { trigger, pending: isMutating }
}
