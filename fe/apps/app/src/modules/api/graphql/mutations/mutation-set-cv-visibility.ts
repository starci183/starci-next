import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SetCvVisibilityInput,
    SetCvVisibilityMutation,
    SetCvVisibilityMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<SetCvVisibilityMutation, SetCvVisibilityMutationVariables> = gql`
    mutation SetCvVisibility($input: SetCvVisibilityInput!) {
        setCvVisibility(input: $input) {
            slug
            path
            isPublic
            verifiedCount
        }
    }
`

/** The input of the setCvVisibility mutation. */
type MutateSetCvVisibilityRequest = SetCvVisibilityInput

/** Params of {@link mutateSetCvVisibility}. */
interface MutateSetCvVisibilityParams {
    readonly request: MutateSetCvVisibilityRequest
    readonly signal?: AbortSignal | undefined
}

/** Makes the public CV link visible or hidden. */
export const mutateSetCvVisibility = async ({
    request,
    signal,
}: MutateSetCvVisibilityParams): Promise<ApolloClient.MutateResult<SetCvVisibilityMutation>> => {
    const variables: InputVariables<MutateSetCvVisibilityRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
