import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { CourseCasesInput, CourseCasesQuery, CourseCasesQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<CourseCasesQuery, CourseCasesQueryVariables> = gql`
    query CourseCases($input: CourseCasesInput!) {
        courseCases(input: $input) {
            currentCaseId
            cases {
                caseId
                kind
                status
                everGreen
                hintsOpened
                diffAvailable
                resetAvailable
                lastRun {
                    ranAt
                    durationMs
                    learnerCommit
                    failed {
                        invariant
                        message
                        expected
                        actual
                    }
                }
            }
        }
    }
`

/** Reads where the learner stands in each case of one lesson (the back end `courseCases` query). */
export const queryCourseCases = async ({
    request,
    signal,
}: QueryParams<CourseCasesInput>): Promise<ApolloClient.QueryResult<CourseCasesQuery>> => {
    const variables: InputVariables<CourseCasesInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
