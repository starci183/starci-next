"use client"

import useSWRMutation from "swr/mutation"
import { signUp, type GraphQLResponse, type IdentityChallenge } from "@/modules/api"

/** Cache identity of the call; a mutation never reads it back. */
const MUTATE_IDENTITY_SIGN_UP_SWR_KEY = "MUTATE_IDENTITY_SIGN_UP_SWR"

/** What the call takes. */
type PostIdentitySignUpInput = { readonly email: string; readonly password: string }

/** The mutation arguments SWR hands the fetcher. */
type PostIdentitySignUpOptions = { readonly arg: PostIdentitySignUpInput }

/** What usePostIdentitySignUpSwr answers: the call, which resolves with the one outcome, and whether it runs. */
type PostIdentitySignUpHook = {
    readonly trigger: (input: PostIdentitySignUpInput) => Promise<GraphQLResponse<IdentityChallenge>>
    readonly pending: boolean
}

/** Creates the account and opens the sign-up challenge. */
export const usePostIdentitySignUpSwr = (): PostIdentitySignUpHook => {
    const { trigger, isMutating } = useSWRMutation(
        MUTATE_IDENTITY_SIGN_UP_SWR_KEY,
        (_key: string, { arg }: PostIdentitySignUpOptions) => signUp(arg.email, arg.password),
    )
    return { trigger, pending: isMutating }
}
