import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    ConfirmAvatarUploadInput,
    ConfirmAvatarUploadMutation,
    ConfirmAvatarUploadMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<ConfirmAvatarUploadMutation, ConfirmAvatarUploadMutationVariables> = gql`
    mutation ConfirmAvatarUpload($input: ConfirmAvatarUploadInput!) {
        confirmAvatarUpload(input: $input) {
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

/** The input of the confirmAvatarUpload mutation. */
type MutateConfirmAvatarUploadRequest = ConfirmAvatarUploadInput

/** Params of {@link mutateConfirmAvatarUpload}. */
interface MutateConfirmAvatarUploadParams {
    readonly request: MutateConfirmAvatarUploadRequest
    readonly signal?: AbortSignal | undefined
}

/** Keeps an avatar the browser uploaded, once the store holds what was asked. */
export const mutateConfirmAvatarUpload = async ({
    request,
    signal,
}: MutateConfirmAvatarUploadParams): Promise<ApolloClient.MutateResult<ConfirmAvatarUploadMutation>> => {
    const variables: InputVariables<MutateConfirmAvatarUploadRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
