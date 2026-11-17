"use client"

import useSWRMutation from "swr/mutation"
import { verifySignIn, type GraphQLResponse } from "@/modules/api"

/** Cache identity of the call; a mutation never reads it back. */
const MUTATE_IDENTITY_SIGN_IN_VERIFY_SWR_KEY = "MUTATE_IDENTITY_SIGN_IN_VERIFY_SWR"

/** What the call takes. */
type PostIdentitySignInVerifyInput = { readonly challenge: string; readonly code: string }

/** The mutation arguments SWR hands the fetcher. */
type PostIdentitySignInVerifyOptions = { readonly arg: PostIdentitySignInVerifyInput }

/** What usePostIdentitySignInVerifySwr answers: the call, which resolves with the one outcome, and whether it runs. */
type PostIdentitySignInVerifyHook = {
    readonly trigger: (input: PostIdentitySignInVerifyInput) => Promise<GraphQLResponse<null>>
    readonly pending: boolean
}

/** Sends the emailed code of a sign-in challenge. */
export const usePostIdentitySignInVerifySwr = (): PostIdentitySignInVerifyHook => {
    const { trigger, isMutating } = useSWRMutation(
        MUTATE_IDENTITY_SIGN_IN_VERIFY_SWR_KEY,
        (_key: string, { arg }: PostIdentitySignInVerifyOptions) => verifySignIn(arg.challenge, arg.code),
    )
    return { trigger, pending: isMutating }
}
