import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    ClaimPracticeExperienceInput,
    ClaimPracticeExperienceMutation,
    ClaimPracticeExperienceMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<ClaimPracticeExperienceMutation, ClaimPracticeExperienceMutationVariables> = gql`
    mutation ClaimPracticeExperience($input: ClaimPracticeExperienceInput!) {
        claimPracticeExperience(input: $input) {
            itemId
            state
            part
        }
    }
`

/** Claims the experience item of a pattern whose problems are all Accepted. */
export const mutateClaimPracticeExperience = async ({
    request,
    signal,
}: QueryParams<ClaimPracticeExperienceInput>): Promise<ApolloClient.MutateResult<ClaimPracticeExperienceMutation>> => {
    const variables: InputVariables<ClaimPracticeExperienceInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
