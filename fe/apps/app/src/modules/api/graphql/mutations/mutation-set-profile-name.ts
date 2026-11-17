import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SetProfileNameInput,
    SetProfileNameMutation,
    SetProfileNameMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<SetProfileNameMutation, SetProfileNameMutationVariables> = gql`
    mutation SetProfileName($input: SetProfileNameInput!) {
        setProfileName(input: $input) {
            displayName
            avatarUrl
            avatarUpdatedAt
            goal {
                pathId
                title
            }
            limits {
                maxBytes
                contentTypes
                nameMax
            }
        }
    }
`

/** The input of the setProfileName mutation. */
type MutateSetProfileNameRequest = SetProfileNameInput

/** Params of {@link mutateSetProfileName}. */
interface MutateSetProfileNameParams {
    readonly request: MutateSetProfileNameRequest
    readonly signal?: AbortSignal | undefined
}

/** Sets the display name of the learner, or clears it with an empty one. */
export const mutateSetProfileName = async ({
    request,
    signal,
}: MutateSetProfileNameParams): Promise<ApolloClient.MutateResult<SetProfileNameMutation>> => {
    const variables: InputVariables<MutateSetProfileNameRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
