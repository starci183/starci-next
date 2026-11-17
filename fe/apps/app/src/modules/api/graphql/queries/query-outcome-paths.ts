import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { OutcomePathsInput, OutcomePathsQuery, OutcomePathsQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<OutcomePathsQuery, OutcomePathsQueryVariables> = gql`
    query OutcomePaths($input: OutcomePathsInput!) {
        outcomePaths(input: $input) {
            activePathId
            paths {
                pathId
                kind
                title
                pitch
                done
                checks {
                    text
                    selfReported
                }
                weeks
                stepCount
                parts {
                    part
                    label
                }
                stages {
                    stageId
                    title
                    steps {
                        stepId
                        part
                        title
                        link
                    }
                }
            }
        }
    }
`

/** The request of the outcome paths: the locale of the texts. */
type QueryOutcomePathsRequest = OutcomePathsInput

/** Reads the goal layer: the five outcome paths and the one the learner follows (the back end `outcomePaths` query). */
export const queryOutcomePaths = async ({
    request,
    signal,
}: QueryParams<QueryOutcomePathsRequest>): Promise<ApolloClient.QueryResult<OutcomePathsQuery>> => {
    const variables: InputVariables<QueryOutcomePathsRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
