import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    InterviewHintInput,
    InterviewHintMutation,
    InterviewHintMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, OperationParams } from "../types"

const document: TypedDocumentNode<InterviewHintMutation, InterviewHintMutationVariables> = gql`
    mutation InterviewHint($input: InterviewHintInput!) {
        interviewHint(input: $input) {
            turnId
            text
            hintsUsed
            hintsLeft
        }
    }
`

/** Gives the next authored hint. */
export const mutateInterviewHint = async ({
    request,
    signal,
}: OperationParams<InterviewHintInput>): Promise<ApolloClient.MutateResult<InterviewHintMutation>> => {
    const variables: InputVariables<InterviewHintInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: document, variables })
}
