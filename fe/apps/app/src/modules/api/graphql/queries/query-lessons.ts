import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { LessonsInput, LessonsQuery, LessonsQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LessonsQuery, LessonsQueryVariables> = gql`
    query Lessons($input: LessonsInput!) {
        lessons(input: $input) {
            id
            title
            description
            category
            group
            topic {
                id
                title
            }
            difficulty
            minutes
            languages
            providers
        }
    }
`

/** The request of the lessons query: the locale of the titles and the optional filters. */
type QueryLessonsRequest = LessonsInput

/** Reads the published lessons (the back end `lessons` query). Rejects with the back end failure instead of answering partial data. */
export const queryLessons = async ({
    request,
    signal,
}: QueryParams<QueryLessonsRequest>): Promise<ApolloClient.QueryResult<LessonsQuery>> => {
    const variables: InputVariables<QueryLessonsRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
