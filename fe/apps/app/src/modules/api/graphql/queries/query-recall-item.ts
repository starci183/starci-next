import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { RecallItemInput, RecallItemQuery, RecallItemQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<RecallItemQuery, RecallItemQueryVariables> = gql`
    query RecallItem($input: RecallItemInput!) {
        recallItem(input: $input) {
            itemId
            source
            question
            level
            tags
            langs
            cloze {
                n
                choices
            }
            lessonId
            activityId
            deckTitle
            lessonTitle
            revision
            flipped
        }
    }
`

/** The request of the recallItem query. */
type QueryRecallItemRequest = RecallItemInput

/** Reads the front of one review item; never the answer. */
export const queryRecallItem = async ({
    request,
    signal,
}: QueryParams<QueryRecallItemRequest>): Promise<ApolloClient.QueryResult<RecallItemQuery>> => {
    const variables: InputVariables<QueryRecallItemRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
