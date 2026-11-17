import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { LessonProgressInput, LessonProgressQuery, LessonProgressQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LessonProgressQuery, LessonProgressQueryVariables> = gql`
    query LessonProgress($input: LessonProgressInput!) {
        lessonProgress(input: $input) {
            lessonId
            version
            phase
            completedAt
            phases {
                phase
                state
                done
                total
            }
            outcomes {
                id
                understood
                proved
                state
            }
            attempts {
                total
                activities
                graded
                failed
                pending
            }
            activities {
                activityId
                phase
                kind
                attempts
                latestAttemptId
                latestRevision
                latestStatus
                latest {
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
            simulations {
                activityId
                currentStateId
                actionIds
                triedTransitionIds
                updatedAt
            }
            reviews {
                activityId
                afterDays
                dueOn
                done
            }
        }
    }
`

/** The request of the progress query: the lesson. */
type QueryLessonProgressRequest = LessonProgressInput

/** Reads the learner progress in one lesson (the back end `lessonProgress` query). */
export const queryLessonProgress = async ({
    request,
    signal,
}: QueryParams<QueryLessonProgressRequest>): Promise<ApolloClient.QueryResult<LessonProgressQuery>> => {
    const variables: InputVariables<QueryLessonProgressRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
