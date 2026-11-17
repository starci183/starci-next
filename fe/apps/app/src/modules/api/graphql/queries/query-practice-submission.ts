import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    PracticeSubmissionInput,
    PracticeSubmissionQuery,
    PracticeSubmissionQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<PracticeSubmissionQuery, PracticeSubmissionQueryVariables> = gql`
    query PracticeSubmission($input: PracticeSubmissionInput!) {
        practiceSubmission(input: $input) {
            id
            slug
            language
            kind
            verdict
            compileOutput
            failureCode
            tests {
                index
                passed
                status
                timeMs
                memoryKb
                example {
                    input
                    expected
                    actual
                }
            }
            passedCount
            totalCount
            timeMs
            memoryKb
        }
    }
`

/** The request of the practiceSubmission query. */
type QueryPracticeSubmissionRequest = PracticeSubmissionInput

/** Reads one run or submission, polled until the judge settles it. */
export const queryPracticeSubmission = async ({
    request,
    signal,
}: QueryParams<QueryPracticeSubmissionRequest>): Promise<ApolloClient.QueryResult<PracticeSubmissionQuery>> => {
    const variables: InputVariables<QueryPracticeSubmissionRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
