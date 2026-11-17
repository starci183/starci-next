import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    InterviewHistoryInput,
    InterviewHistoryQuery,
    InterviewHistoryQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const document: TypedDocumentNode<InterviewHistoryQuery, InterviewHistoryQueryVariables> = gql`
    query InterviewHistory($input: InterviewHistoryInput!) {
        interviewHistory(input: $input) {
            items {
                sessionId
                track
                tier
                startedAt
                status
                overallScore
                verdict
            }
            trend {
                track
                tier
                scores
            }
        }
    }
`

/** Reads the sessions of the learner and the score trend. */
export const queryInterviewHistory = async ({
    request,
    signal,
}: QueryParams<InterviewHistoryInput>): Promise<ApolloClient.QueryResult<InterviewHistoryQuery>> => {
    const variables: InputVariables<InterviewHistoryInput> = { input: request }
    return createApolloClient({ signal }).query({ query: document, variables })
}
