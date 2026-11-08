import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    InterviewOptionsInput,
    InterviewOptionsQuery,
    InterviewOptionsQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const document: TypedDocumentNode<InterviewOptionsQuery, InterviewOptionsQueryVariables> = gql`
    query InterviewOptions($input: InterviewOptionsInput!) {
        interviewOptions(input: $input) {
            tracks {
                id
                title
            }
            banks {
                bankId
                family
                title
                difficulty
                tiers
                languages
                questionCount
                freeQuestionCount
            }
            access {
                isPremium
                freeSessionsLeftThisMonth
                resetsAt
                length
            }
            active {
                sessionId
                track
                tier
                startedAt
                status
                overallScore
                verdict
            }
        }
    }
`

/** Reads the tracks, the live banks, the access of the learner and the session in progress. */
export const queryInterviewOptions = async ({
    request,
    signal,
}: QueryParams<InterviewOptionsInput>): Promise<ApolloClient.QueryResult<InterviewOptionsQuery>> => {
    const variables: InputVariables<InterviewOptionsInput> = { input: request }
    return createApolloClient({ signal }).query({ query: document, variables })
}
