import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    SetExperienceReviewerInput,
    SetExperienceReviewerMutation,
    SetExperienceReviewerMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<SetExperienceReviewerMutation, SetExperienceReviewerMutationVariables> = gql`
    mutation SetExperienceReviewer($input: SetExperienceReviewerInput!) {
        setExperienceReviewer(input: $input) {
            reviewerId
            parts
            capacity
            conflicts
            appointedAt
            endedAt
            openItems
        }
    }
`

/** Appoints, rescopes or ends a reviewer (the teacher only). */
export const mutateSetExperienceReviewer = async ({
    request,
    signal,
}: QueryParams<SetExperienceReviewerInput>): Promise<ApolloClient.MutateResult<SetExperienceReviewerMutation>> => {
    const variables: InputVariables<SetExperienceReviewerInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
