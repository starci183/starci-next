import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    LessonChallengeScoresInput,
    LessonChallengeScoresQuery,
    LessonChallengeScoresQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LessonChallengeScoresQuery, LessonChallengeScoresQueryVariables> = gql`
    query LessonChallengeScores($input: LessonChallengeScoresInput!) {
        lessonChallengeScores(input: $input) {
            challengeId
            level
            state
            score
            maxScore
            isLocked
            isPassed
            unlocksNext
            hiddenGreen
            hiddenTotal
            isCriticalMet
            criteria {
                id
                points
                earned
                isCritical
                passed
            }
        }
    }
`

/** Reads the score of each rung of the ladder of a lesson (the back end `lessonChallengeScores` query). */
export const queryLessonChallengeScores = async ({
    request,
    signal,
}: QueryParams<LessonChallengeScoresInput>): Promise<ApolloClient.QueryResult<LessonChallengeScoresQuery>> => {
    const variables: InputVariables<LessonChallengeScoresInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
