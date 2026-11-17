import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { RecallTodayInput, ReviewTodayQuery, ReviewTodayQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ReviewTodayQuery, ReviewTodayQueryVariables> = gql`
    query ReviewToday($input: RecallTodayInput!) {
        reviewToday(input: $input) {
            date
            due
            overdue
            newAvailable
            lockedCount
            goal {
                daily
                done
            }
            items {
                itemId
                source
                status
                deckTitle
                lessonTitle
                level
                locked
                dueOn
            }
        }
    }
`

/** The request of the reviewToday query. */
type QueryReviewTodayRequest = RecallTodayInput

/** Reads the review queue of today: what is due, what is new and what waits behind Premium. */
export const queryReviewToday = async ({
    request,
    signal,
}: QueryParams<QueryReviewTodayRequest>): Promise<ApolloClient.QueryResult<ReviewTodayQuery>> => {
    const variables: InputVariables<QueryReviewTodayRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
