import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    RequestAvatarUploadInput,
    RequestAvatarUploadMutation,
    RequestAvatarUploadMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables } from "../types"

const mutation1: TypedDocumentNode<RequestAvatarUploadMutation, RequestAvatarUploadMutationVariables> = gql`
    mutation RequestAvatarUpload($input: RequestAvatarUploadInput!) {
        requestAvatarUpload(input: $input) {
            key
            method
            url
            headers {
                name
                value
            }
            expiresAt
            limits {
                maxBytes
                contentTypes
                nameMax
            }
        }
    }
`

/** The input of the requestAvatarUpload mutation. */
type MutateRequestAvatarUploadRequest = RequestAvatarUploadInput

/** Params of {@link mutateRequestAvatarUpload}. */
interface MutateRequestAvatarUploadParams {
    readonly request: MutateRequestAvatarUploadRequest
    readonly signal?: AbortSignal | undefined
}

/** Asks for a signed avatar upload; the type and size are held to the profile limits before anything is signed. */
export const mutateRequestAvatarUpload = async ({
    request,
    signal,
}: MutateRequestAvatarUploadParams): Promise<ApolloClient.MutateResult<RequestAvatarUploadMutation>> => {
    const variables: InputVariables<MutateRequestAvatarUploadRequest> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
