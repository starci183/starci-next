import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { RecallDecksInput, ReviewDecksQuery, ReviewDecksQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ReviewDecksQuery, ReviewDecksQueryVariables> = gql`
    query ReviewDecks($input: RecallDecksInput!) {
        reviewDecks(input: $input) {
            deckId
            course
            title
            description
            difficulty
            cardCount
            freeCardCount
            added
            track
        }
    }
`

/** The request of the reviewDecks query. */
type QueryReviewDecksRequest = RecallDecksInput

/** Lists the flashcard decks with whether the learner added each. */
export const queryReviewDecks = async ({
    request,
    signal,
}: QueryParams<QueryReviewDecksRequest>): Promise<ApolloClient.QueryResult<ReviewDecksQuery>> => {
    const variables: InputVariables<QueryReviewDecksRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
