import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    PracticePatternsInput,
    PracticePatternsQuery,
    PracticePatternsQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<PracticePatternsQuery, PracticePatternsQueryVariables> = gql`
    query PracticePatterns($input: PracticePatternsInput!) {
        practicePatterns(input: $input) {
            patternId
            title
            problemCount
            acceptedCount
            freeCount
            locked
        }
    }
`

/** The request of the practicePatterns query. */
type QueryPracticePatternsRequest = PracticePatternsInput

/** Reads the 20 patterns with the reader's accepted count in each. */
export const queryPracticePatterns = async ({
    request,
    signal,
}: QueryParams<QueryPracticePatternsRequest>): Promise<ApolloClient.QueryResult<PracticePatternsQuery>> => {
    const variables: InputVariables<QueryPracticePatternsRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
