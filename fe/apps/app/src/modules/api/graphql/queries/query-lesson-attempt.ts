import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { LessonAttemptInput, LessonAttemptQuery, LessonAttemptQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LessonAttemptQuery, LessonAttemptQueryVariables> = gql`
    query LessonAttempt($input: LessonAttemptInput!) {
        lessonAttempt(input: $input) {
            attemptId
            lessonId
            version
            activityId
            revision
            kind
            phase
            status
            failureCode
            submittedAt
            gradedAt
            answer {
                optionId
                text
                actionIds
                reachedStateId
                debrief
            }
            result {
                correct
                success
                reachedStateId
                score
                maxScore
                isDiagnostic
                options {
                    optionId
                    isCorrect
                    selected
                    explanation
                }
                criteria {
                    criterionId
                    criterion
                    level
                    evidenceQuote
                    maxScore
                    missing
                }
            }
        }
    }
`

/** The request of the attempt query: the attempt to read. */
type QueryLessonAttemptRequest = LessonAttemptInput

/** Reads one attempt and its result (the back end `lessonAttempt` query); polled while the status is grading. */
export const queryLessonAttempt = async ({
    request,
    signal,
}: QueryParams<QueryLessonAttemptRequest>): Promise<ApolloClient.QueryResult<LessonAttemptQuery>> => {
    const variables: InputVariables<QueryLessonAttemptRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
