import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    RevealPracticeSolutionInput,
    RevealPracticeSolutionMutation,
    RevealPracticeSolutionMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<RevealPracticeSolutionMutation, RevealPracticeSolutionMutationVariables> = gql`
    mutation RevealPracticeSolution($input: RevealPracticeSolutionInput!) {
        revealPracticeSolution(input: $input) {
            slug
            solution
            revealedAt
            countedForExperience
        }
    }
`

/** The input of the revealPracticeSolution mutation. */
type MutateRevealPracticeSolutionRequest = RevealPracticeSolutionInput

/** Params of {@link mutateRevealPracticeSolution}. */
interface MutateRevealPracticeSolutionParams {
    readonly request: MutateRevealPracticeSolutionRequest
    readonly signal?: AbortSignal | undefined
}

/** Reveals the reference solution of a problem and records that it was seen. */
export const mutateRevealPracticeSolution = async ({
    request,
    signal,
}: MutateRevealPracticeSolutionParams): Promise<ApolloClient.MutateResult<RevealPracticeSolutionMutation>> => {
    const variables: InputVariables<MutateRevealPracticeSolutionRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
