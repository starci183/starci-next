import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { ProfileInput, RemoveAvatarMutation, RemoveAvatarMutationVariables } from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<RemoveAvatarMutation, RemoveAvatarMutationVariables> = gql`
    mutation RemoveAvatar($input: ProfileInput!) {
        removeAvatar(input: $input) {
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

/** The input of the removeAvatar mutation. */
type MutateRemoveAvatarRequest = ProfileInput

/** Params of {@link mutateRemoveAvatar}. */
interface MutateRemoveAvatarParams {
    readonly request: MutateRemoveAvatarRequest
    readonly signal?: AbortSignal | undefined
}

/** Removes the avatar of the learner. */
export const mutateRemoveAvatar = async ({
    request,
    signal,
}: MutateRemoveAvatarParams): Promise<ApolloClient.MutateResult<RemoveAvatarMutation>> => {
    const variables: InputVariables<MutateRemoveAvatarRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
