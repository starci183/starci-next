import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    PracticeProblemInput,
    PracticeProblemQuery,
    PracticeProblemQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<PracticeProblemQuery, PracticeProblemQueryVariables> = gql`
    query PracticeProblem($input: PracticeProblemInput!) {
        practiceProblem(input: $input) {
            slug
            title
            patternId
            patternTitle
            difficulty
            tags
            statementMarkdown
            timeLimitMs
            memoryLimitKb
            locked
            starterCodes {
                language
                content
            }
            examples {
                input
                output
            }
            hintsTotal
            hintsRevealed {
                step
                title
                markdown
            }
            status
            nextSlug
        }
    }
`

/** The request of the practiceProblem query. */
type QueryPracticeProblemRequest = PracticeProblemInput

/** Reads one problem: statement, starter code, examples and the hints this reader revealed (never tests or solutions). */
export const queryPracticeProblem = async ({
    request,
    signal,
}: QueryParams<QueryPracticeProblemRequest>): Promise<ApolloClient.QueryResult<PracticeProblemQuery>> => {
    const variables: InputVariables<QueryPracticeProblemRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
