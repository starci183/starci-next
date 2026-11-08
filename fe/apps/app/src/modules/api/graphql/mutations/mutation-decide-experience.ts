import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    DecideExperienceInput,
    DecideExperienceMutation,
    DecideExperienceMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<DecideExperienceMutation, DecideExperienceMutationVariables> = gql`
    mutation DecideExperience($input: DecideExperienceInput!) {
        decideExperience(input: $input) {
            itemId
            state
            refusal
        }
    }
`

/** Approves or returns a batch of pending items; each answers its new state or the code that refused it. */
export const mutateDecideExperience = async ({
    request,
    signal,
}: QueryParams<DecideExperienceInput>): Promise<ApolloClient.MutateResult<DecideExperienceMutation>> => {
    const variables: InputVariables<DecideExperienceInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
