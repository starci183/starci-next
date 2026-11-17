import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    PracticeProblemsInput,
    PracticeProblemsQuery,
    PracticeProblemsQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<PracticeProblemsQuery, PracticeProblemsQueryVariables> = gql`
    query PracticeProblems($input: PracticeProblemsInput!) {
        practiceProblems(input: $input) {
            slug
            title
            difficulty
            tags
            status
            locked
            orderIndex
        }
    }
`

/** The request of the practiceProblems query. */
type QueryPracticeProblemsRequest = PracticeProblemsInput

/** Reads the problems of one pattern with the reader's status on each. */
export const queryPracticeProblems = async ({
    request,
    signal,
}: QueryParams<QueryPracticeProblemsRequest>): Promise<ApolloClient.QueryResult<PracticeProblemsQuery>> => {
    const variables: InputVariables<QueryPracticeProblemsRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
