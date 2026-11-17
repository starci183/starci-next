import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { RecallDeckDetailInput, ReviewDeckQuery, ReviewDeckQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ReviewDeckQuery, ReviewDeckQueryVariables> = gql`
    query ReviewDeck($input: RecallDeckDetailInput!) {
        reviewDeck(input: $input) {
            deck {
                deckId
                course
                title
                description
                difficulty
                cardCount
                added
                track
            }
            sampleCards {
                cardId
                kind
                question
            }
            progress {
                total
                learned
                remembering
                needsReview
            }
            estimatedNewPerDay
        }
    }
`

/** The request of the reviewDeck query. */
type QueryReviewDeckRequest = RecallDeckDetailInput

/** Reads one flashcard deck with sample questions and the learner progress in it. */
export const queryReviewDeck = async ({
    request,
    signal,
}: QueryParams<QueryReviewDeckRequest>): Promise<ApolloClient.QueryResult<ReviewDeckQuery>> => {
    const variables: InputVariables<QueryReviewDeckRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
