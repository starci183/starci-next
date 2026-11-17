"use client"

import useSWRMutation from "swr/mutation"
import { startSocialSignIn, type GraphQLResponse, type SocialProvider } from "@/modules/api"
import { rememberSocialState } from "@/modules/social-state"

/** Cache identity of the call; a mutation never reads it back. */
const MUTATE_IDENTITY_SOCIAL_START_SWR_KEY = "MUTATE_IDENTITY_SOCIAL_START_SWR"

/** What the call takes. */
type PostIdentitySocialStartInput = { readonly provider: SocialProvider; readonly returnTo: string | undefined }

/** The mutation arguments SWR hands the fetcher. */
type PostIdentitySocialStartOptions = { readonly arg: PostIdentitySocialStartInput }

/** What usePostIdentitySocialStartSwr answers: the call, which resolves with the one outcome, and whether it runs. */
type PostIdentitySocialStartHook = {
    readonly trigger: (input: PostIdentitySocialStartInput) => Promise<GraphQLResponse<string>>
    readonly pending: boolean
}

/**
 * Asks for the authorization URL of the chosen provider and keeps its state for this tab, so the callback exchanges only
 * the sign-in this tab started.
 */
export const usePostIdentitySocialStartSwr = (): PostIdentitySocialStartHook => {
    const { trigger, isMutating } = useSWRMutation(
        MUTATE_IDENTITY_SOCIAL_START_SWR_KEY,
        (_key: string, { arg }: PostIdentitySocialStartOptions) =>
            startSocialSignIn(arg.provider, arg.returnTo).then((started) => {
                if (started.success) rememberSocialState(started.data)
                return started
            }),
    )
    return { trigger, pending: isMutating }
}
