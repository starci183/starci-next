import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    InterviewSessionRefInput,
    SubmitInterviewMutation,
    SubmitInterviewMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, OperationParams } from "../types"

const document: TypedDocumentNode<SubmitInterviewMutation, SubmitInterviewMutationVariables> = gql`
    mutation SubmitInterview($input: InterviewSessionRefInput!) {
        submitInterview(input: $input) {
            sessionId
            status
            failureCode
        }
    }
`

/** Ends the interview and grades the whole session once. */
export const mutateSubmitInterview = async ({
    request,
    signal,
}: OperationParams<InterviewSessionRefInput>): Promise<ApolloClient.MutateResult<SubmitInterviewMutation>> => {
    const variables: InputVariables<InterviewSessionRefInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: document, variables })
}
