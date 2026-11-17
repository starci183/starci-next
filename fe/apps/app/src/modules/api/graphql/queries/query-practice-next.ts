import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { PracticeNextInput, PracticeNextQuery, PracticeNextQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<PracticeNextQuery, PracticeNextQueryVariables> = gql`
    query PracticeNext($input: PracticeNextInput!) {
        practiceNext(input: $input) {
            next {
                slug
                title
                patternId
                patternTitle
                position
                patternProblemCount
            }
            resume {
                slug
                title
                patternId
                patternTitle
                attempts
                lastVerdict
                failedTestIndex
            }
        }
    }
`

/** The request of the practiceNext query. */
type QueryPracticeNextRequest = PracticeNextInput

/** Reads the next problem to solve and the one left unfinished, in the whole catalog or in one pattern. */
export const queryPracticeNext = async ({
    request,
    signal,
}: QueryParams<QueryPracticeNextRequest>): Promise<ApolloClient.QueryResult<PracticeNextQuery>> => {
    const variables: InputVariables<QueryPracticeNextRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
