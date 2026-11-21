import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    LessonOpenerScoresInput,
    LessonOpenerScoresQuery,
    LessonOpenerScoresQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LessonOpenerScoresQuery, LessonOpenerScoresQueryVariables> = gql`
    query LessonOpenerScores($input: LessonOpenerScoresInput!) {
        lessonOpenerScores(input: $input) {
            lessonId
            answered
            firstCorrect
            latestCorrect
            solved
            isPassed
            questions {
                activityId
                firstCorrect
                latestCorrect
                isSolved
                attempts
            }
        }
    }
`

/** Reads the five-question opener scores (before and after) of some lessons (the back end `lessonOpenerScores` query). */
export const queryLessonOpenerScores = async ({
    request,
    signal,
}: QueryParams<LessonOpenerScoresInput>): Promise<ApolloClient.QueryResult<LessonOpenerScoresQuery>> => {
    const variables: InputVariables<LessonOpenerScoresInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
