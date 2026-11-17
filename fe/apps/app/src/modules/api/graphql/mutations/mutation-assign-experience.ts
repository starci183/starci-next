import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    AssignExperienceInput,
    AssignExperienceMutation,
    AssignExperienceMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<AssignExperienceMutation, AssignExperienceMutationVariables> = gql`
    mutation AssignExperience($input: AssignExperienceInput!) {
        assignExperience(input: $input) {
            itemId
            state
        }
    }
`

/** Assigns a pending item to a reviewer, or back to the teacher's queue (the teacher only). */
export const mutateAssignExperience = async ({
    request,
    signal,
}: QueryParams<AssignExperienceInput>): Promise<ApolloClient.MutateResult<AssignExperienceMutation>> => {
    const variables: InputVariables<AssignExperienceInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
