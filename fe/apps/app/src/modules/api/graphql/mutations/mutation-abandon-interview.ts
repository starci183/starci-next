import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    InterviewSessionRefInput,
    AbandonInterviewMutation,
    AbandonInterviewMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, OperationParams } from "../types"

const document: TypedDocumentNode<AbandonInterviewMutation, AbandonInterviewMutationVariables> = gql`
    mutation AbandonInterview($input: InterviewSessionRefInput!) {
        abandonInterview(input: $input) {
            sessionId
            status
        }
    }
`

/** Abandons the active session. */
export const mutateAbandonInterview = async ({
    request,
    signal,
}: OperationParams<InterviewSessionRefInput>): Promise<ApolloClient.MutateResult<AbandonInterviewMutation>> => {
    const variables: InputVariables<InterviewSessionRefInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: document, variables })
}
