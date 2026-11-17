"use client"

import {
    usePostIdentityPasswordResetSwr,
    usePostIdentitySignInSwr,
    usePostIdentitySignUpSwr,
    usePostIdentitySocialStartSwr,
    type GraphQLResponse,
    type IdentityChallenge,
    type SocialProvider,
} from "@/hooks/swr"

/** The doors that start a flow: three open a challenge, the fourth asks for the provider URL. */
type ChallengeOpeners = {
    readonly pending: boolean
    readonly signIn: (identifier: string, password: string) => Promise<GraphQLResponse<IdentityChallenge>>
    readonly signUp: (email: string, password: string) => Promise<GraphQLResponse<IdentityChallenge>>
    readonly reset: (email: string) => Promise<GraphQLResponse<IdentityChallenge>>
    readonly social: (provider: SocialProvider, returnTo: string | undefined) => Promise<GraphQLResponse<string>>
}

/** The calls that open a sign-in, sign-up or password-reset challenge, or start a social sign-in, and whether any runs. */
export const useChallengeOpeners = (): ChallengeOpeners => {
    const signIn = usePostIdentitySignInSwr()
    const signUp = usePostIdentitySignUpSwr()
    const reset = usePostIdentityPasswordResetSwr()
    const social = usePostIdentitySocialStartSwr()
    return {
        pending: signIn.pending || signUp.pending || reset.pending || social.pending,
        signIn: (identifier, password) => signIn.trigger({ identifier, password }),
        signUp: (email, password) => signUp.trigger({ email, password }),
        reset: (email) => reset.trigger({ email }),
        social: (provider, returnTo) => social.trigger({ provider, returnTo }),
    }
}
