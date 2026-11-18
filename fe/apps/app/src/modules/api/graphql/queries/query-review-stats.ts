import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { RecallStatsInput, ReviewStatsQuery, ReviewStatsQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ReviewStatsQuery, ReviewStatsQueryVariables> = gql`
    query ReviewStats($input: RecallStatsInput!) {
        reviewStats(input: $input) {
            activeDaysPerWeek
            recallRateByReview {
                n
                rate
            }
        }
    }
`

/** The request of the reviewStats query. */
type QueryReviewStatsRequest = RecallStatsInput

/** Reads how often the learner reviews and how well they remember by the number of the review. */
export const queryReviewStats = async ({
    request,
    signal,
}: QueryParams<QueryReviewStatsRequest>): Promise<ApolloClient.QueryResult<ReviewStatsQuery>> => {
    const variables: InputVariables<QueryReviewStatsRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
