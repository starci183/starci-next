import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    RevokeExperienceInput,
    RevokeExperienceMutation,
    RevokeExperienceMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<RevokeExperienceMutation, RevokeExperienceMutationVariables> = gql`
    mutation RevokeExperience($input: RevokeExperienceInput!) {
        revokeExperience(input: $input) {
            itemId
            state
            revokedAt
        }
    }
`

/** Revokes a verified item with a reason (the teacher only). */
export const mutateRevokeExperience = async ({
    request,
    signal,
}: QueryParams<RevokeExperienceInput>): Promise<ApolloClient.MutateResult<RevokeExperienceMutation>> => {
    const variables: InputVariables<RevokeExperienceInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
