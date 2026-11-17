"use client"

import useSWRMutation from "swr/mutation"
import { verifySignUp, type GraphQLResponse } from "@/modules/api"

/** Cache identity of the call; a mutation never reads it back. */
const MUTATE_IDENTITY_SIGN_UP_VERIFY_SWR_KEY = "MUTATE_IDENTITY_SIGN_UP_VERIFY_SWR"

/** What the call takes. */
type PostIdentitySignUpVerifyInput = { readonly challenge: string; readonly code: string }

/** The mutation arguments SWR hands the fetcher. */
type PostIdentitySignUpVerifyOptions = { readonly arg: PostIdentitySignUpVerifyInput }

/** What usePostIdentitySignUpVerifySwr answers: the call, which resolves with the one outcome, and whether it runs. */
type PostIdentitySignUpVerifyHook = {
    readonly trigger: (input: PostIdentitySignUpVerifyInput) => Promise<GraphQLResponse<null>>
    readonly pending: boolean
}

/** Sends the emailed code of a sign-up challenge. */
export const usePostIdentitySignUpVerifySwr = (): PostIdentitySignUpVerifyHook => {
    const { trigger, isMutating } = useSWRMutation(
        MUTATE_IDENTITY_SIGN_UP_VERIFY_SWR_KEY,
        (_key: string, { arg }: PostIdentitySignUpVerifyOptions) => verifySignUp(arg.challenge, arg.code),
    )
    return { trigger, pending: isMutating }
}
