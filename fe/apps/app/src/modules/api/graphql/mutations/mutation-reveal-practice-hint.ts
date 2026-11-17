import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    RevealPracticeHintInput,
    RevealPracticeHintMutation,
    RevealPracticeHintMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<RevealPracticeHintMutation, RevealPracticeHintMutationVariables> = gql`
    mutation RevealPracticeHint($input: RevealPracticeHintInput!) {
        revealPracticeHint(input: $input) {
            step
            title
            markdown
        }
    }
`

/** The input of the revealPracticeHint mutation. */
type MutateRevealPracticeHintRequest = RevealPracticeHintInput

/** Params of {@link mutateRevealPracticeHint}. */
interface MutateRevealPracticeHintParams {
    readonly request: MutateRevealPracticeHintRequest
    readonly signal?: AbortSignal | undefined
}

/** Reveals the next hint of the ladder; hints come from the data, never from a model. */
export const mutateRevealPracticeHint = async ({
    request,
    signal,
}: MutateRevealPracticeHintParams): Promise<ApolloClient.MutateResult<RevealPracticeHintMutation>> => {
    const variables: InputVariables<MutateRevealPracticeHintRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
