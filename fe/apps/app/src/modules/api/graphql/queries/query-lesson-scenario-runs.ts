import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    LessonScenarioRunsInput,
    LessonScenarioRunsQuery,
    LessonScenarioRunsQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LessonScenarioRunsQuery, LessonScenarioRunsQueryVariables> = gql`
    query LessonScenarioRuns($input: LessonScenarioRunsInput!) {
        lessonScenarioRuns(input: $input) {
            scenarioId
            status
            runId
            slot
            ref
            exitCode
            durationMs
            commit
            output
            challengeTier
            guardsOff
            concepts
            why
            ledger
            at
        }
    }
`

/** Reads the newest relayed run of each scenario of a lesson (the back end `lessonScenarioRuns` query). */
export const queryLessonScenarioRuns = async ({
    request,
    signal,
}: QueryParams<LessonScenarioRunsInput>): Promise<ApolloClient.QueryResult<LessonScenarioRunsQuery>> => {
    const variables: InputVariables<LessonScenarioRunsInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
