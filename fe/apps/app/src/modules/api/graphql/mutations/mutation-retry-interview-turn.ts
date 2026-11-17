import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    InterviewSessionRefInput,
    RetryInterviewTurnMutation,
    RetryInterviewTurnMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, OperationParams } from "../types"

const document: TypedDocumentNode<RetryInterviewTurnMutation, RetryInterviewTurnMutationVariables> = gql`
    mutation RetryInterviewTurn($input: InterviewSessionRefInput!) {
        retryInterviewTurn(input: $input) {
            saved {
                turnId
                position
                role
                kind
                content
                revision
                createdAt
            }
            next {
                turnId
                position
                role
                kind
                content
                revision
                createdAt
            }
            status
            failureCode
        }
    }
`

/** Asks the interviewer again for the turn a failure skipped. */
export const mutateRetryInterviewTurn = async ({
    request,
    signal,
}: OperationParams<InterviewSessionRefInput>): Promise<ApolloClient.MutateResult<RetryInterviewTurnMutation>> => {
    const variables: InputVariables<InterviewSessionRefInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: document, variables })
}
