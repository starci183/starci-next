"use client"

import {
    usePostIdentityChallengeResendSwr,
    usePostIdentityPasswordResetVerifySwr,
    usePostIdentitySignInVerifySwr,
    usePostIdentitySignUpVerifySwr,
    type GraphQLResponse,
} from "@/hooks/swr"

/** The doors that close a challenge with its emailed code, and the one that asks for a new code. */
type ChallengeClosers = {
    readonly pending: boolean
    readonly verifySignIn: (challenge: string, code: string) => Promise<GraphQLResponse<null>>
    readonly verifySignUp: (challenge: string, code: string) => Promise<GraphQLResponse<null>>
    readonly verifyReset: (challenge: string, code: string, password: string) => Promise<GraphQLResponse<null>>
    readonly resend: (challenge: string) => Promise<GraphQLResponse<null>>
}

/** The calls that verify a code for each flow or resend it, and whether any runs. */
export const useChallengeClosers = (): ChallengeClosers => {
    const signIn = usePostIdentitySignInVerifySwr()
    const signUp = usePostIdentitySignUpVerifySwr()
    const reset = usePostIdentityPasswordResetVerifySwr()
    const resend = usePostIdentityChallengeResendSwr()
    return {
        pending: [signIn, signUp, reset, resend].some((each) => each.pending),
        verifySignIn: (challenge, code) => signIn.trigger({ challenge, code }),
        verifySignUp: (challenge, code) => signUp.trigger({ challenge, code }),
        verifyReset: (challenge, code, password) => reset.trigger({ challenge, code, password }),
        resend: (challenge) => resend.trigger({ challenge }),
    }
}
