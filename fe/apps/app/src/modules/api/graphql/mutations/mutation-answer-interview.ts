import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    AnswerInterviewInput,
    AnswerInterviewMutation,
    AnswerInterviewMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, OperationParams } from "../types"

const document: TypedDocumentNode<AnswerInterviewMutation, AnswerInterviewMutationVariables> = gql`
    mutation AnswerInterview($input: AnswerInterviewInput!) {
        answerInterview(input: $input) {
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

/** Stores the answer, then asks the interviewer what follows. */
export const mutateAnswerInterview = async ({
    request,
    signal,
}: OperationParams<AnswerInterviewInput>): Promise<ApolloClient.MutateResult<AnswerInterviewMutation>> => {
    const variables: InputVariables<AnswerInterviewInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: document, variables })
}
