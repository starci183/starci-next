import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    LearnerProgressInput,
    LearnerProgressQuery,
    LearnerProgressQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<LearnerProgressQuery, LearnerProgressQueryVariables> = gql`
    query LearnerProgress($input: LearnerProgressInput!) {
        learnerProgress(input: $input) {
            plan
            ribbon {
                provedConcepts
                streak
                lessonsDone
                buildsDone
            }
            essentials {
                lessonsDone
                lessonsStarted
                lessonsTotal
                beforeCorrect
                afterCorrect
                answered
                topics {
                    topicId
                    title
                    lessonsDone
                    lessonsTotal
                    lessons {
                        lessonId
                        title
                        done
                        started
                        openerTotal
                        openerAnswered
                        before
                        after
                    }
                }
                parts {
                    part
                    order
                    access
                }
            }
            harness {
                origin
                buildsDone
                buildsTotal
                builds {
                    buildId
                    title
                    state
                    stagesProved
                    stagesPractising
                    stagesTotal
                    stages {
                        stageId
                        title
                        state
                    }
                }
                doctor {
                    tool
                    verdict
                    passed
                    total
                }
                trials {
                    trap
                    title
                    tool
                    verdict
                    at
                }
            }
            projects {
                conceptsProved
                conceptsPractising
                conceptsTotal
                milestonesDone
                milestonesTotal
                projects {
                    projectId
                    name
                    proved
                    practising
                    total
                    milestonesDone
                    milestonesTotal
                }
            }
            projectsLocked
            review {
                due
                overdue
                doneToday
                goalDaily
                streak
                longestStreak
                todayCounted
            }
            activity {
                id
                kind
                title
                at
            }
            unavailable
        }
    }
`

/** The request of the progress read: the locale of the lesson and harness titles. */
type QueryLearnerProgressRequest = LearnerProgressInput

/** Reads the progress of the signed-in learner across the whole app (the back end `learnerProgress` query). */
export const queryLearnerProgress = async ({
    request,
    signal,
}: QueryParams<QueryLearnerProgressRequest>): Promise<ApolloClient.QueryResult<LearnerProgressQuery>> => {
    const variables: InputVariables<QueryLearnerProgressRequest> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
