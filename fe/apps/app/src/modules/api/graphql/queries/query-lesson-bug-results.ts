import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    LessonBugResultsInput,
    LessonBugResultsQuery,
    LessonBugResultsQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LessonBugResultsQuery, LessonBugResultsQueryVariables> = gql`
    query LessonBugResults($input: LessonBugResultsInput!) {
        lessonBugResults(input: $input) {
            testId
            status
            isLocked
            at
            received
            output
            pass
            fail
            hints
            hintsOpened
            hintCount
        }
    }
`

/** Reads every Tìm sạn test of a lesson with the learner's newest relayed run (the back end `lessonBugResults` query). */
export const queryLessonBugResults = async ({
    request,
    signal,
}: QueryParams<LessonBugResultsInput>): Promise<ApolloClient.QueryResult<LessonBugResultsQuery>> => {
    const variables: InputVariables<LessonBugResultsInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
