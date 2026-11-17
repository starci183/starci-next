import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    InterviewSessionRefInput,
    RegradeInterviewMutation,
    RegradeInterviewMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, OperationParams } from "../types"

const document: TypedDocumentNode<RegradeInterviewMutation, RegradeInterviewMutationVariables> = gql`
    mutation RegradeInterview($input: InterviewSessionRefInput!) {
        regradeInterview(input: $input) {
            sessionId
            status
            failureCode
        }
    }
`

/** Grades a failed session again. */
export const mutateRegradeInterview = async ({
    request,
    signal,
}: OperationParams<InterviewSessionRefInput>): Promise<ApolloClient.MutateResult<RegradeInterviewMutation>> => {
    const variables: InputVariables<InterviewSessionRefInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: document, variables })
}
