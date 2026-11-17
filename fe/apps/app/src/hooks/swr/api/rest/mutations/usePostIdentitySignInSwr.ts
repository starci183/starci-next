"use client"

import useSWRMutation from "swr/mutation"
import { signIn, type GraphQLResponse, type IdentityChallenge } from "@/modules/api"

/** Cache identity of the call; a mutation never reads it back. */
const MUTATE_IDENTITY_SIGN_IN_SWR_KEY = "MUTATE_IDENTITY_SIGN_IN_SWR"

/** What the call takes. */
type PostIdentitySignInInput = { readonly identifier: string; readonly password: string }

/** The mutation arguments SWR hands the fetcher. */
type PostIdentitySignInOptions = { readonly arg: PostIdentitySignInInput }

/** What usePostIdentitySignInSwr answers: the call, which resolves with the one outcome, and whether it runs. */
type PostIdentitySignInHook = {
    readonly trigger: (input: PostIdentitySignInInput) => Promise<GraphQLResponse<IdentityChallenge>>
    readonly pending: boolean
}

/** Checks the identifier and password and opens the sign-in challenge. */
export const usePostIdentitySignInSwr = (): PostIdentitySignInHook => {
    const { trigger, isMutating } = useSWRMutation(
        MUTATE_IDENTITY_SIGN_IN_SWR_KEY,
        (_key: string, { arg }: PostIdentitySignInOptions) => signIn(arg.identifier, arg.password),
    )
    return { trigger, pending: isMutating }
}
