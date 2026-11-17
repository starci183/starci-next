import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    PracticeSubmissionsInput,
    PracticeSubmissionsQuery,
    PracticeSubmissionsQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<PracticeSubmissionsQuery, PracticeSubmissionsQueryVariables> = gql`
    query PracticeSubmissions($input: PracticeSubmissionsInput!) {
        practiceSubmissions(input: $input) {
            items {
                id
                slug
                problemTitle
                language
                verdict
                passedCount
                totalCount
                timeMs
                memoryKb
                submittedAt
            }
            nextCursor
        }
    }
`

/** The request of the practiceSubmissions query. */
type QueryPracticeSubmissionsRequest = PracticeSubmissionsInput

/** Reads one page of the learner own graded submissions in a pattern, newest first. */
export const queryPracticeSubmissions = async ({
    request,
    signal,
}: QueryParams<QueryPracticeSubmissionsRequest>): Promise<ApolloClient.QueryResult<PracticeSubmissionsQuery>> => {
    const variables: InputVariables<QueryPracticeSubmissionsRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
