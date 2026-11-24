import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { CourseLabInput, CourseLabQuery, CourseLabQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<CourseLabQuery, CourseLabQueryVariables> = gql`
    query CourseLab($input: CourseLabInput!) {
        courseLab(input: $input) {
            courseId
            lessonId
            device
            phase
            connectionLost
            lastSyncedAt
            solutionUnlocked
            chaosOn
            chaos {
                id
                label {
                    vi
                    en
                }
            }
            boot {
                stage
                status
                detail
                durationMs
                at
            }
            tests {
                id
                passed
                durationMs
                message
                name {
                    vi
                    en
                }
            }
            files {
                path
                sha256
                text
            }
            logs {
                service
                lines
            }
            latestSubmission {
                id
                status
                passed
                rejectReason
                commit
                hintsOpened
                timeSpentMs
                createdAt
                gradedAt
                tests {
                    id
                    passed
                }
            }
        }
    }
`

/** Reads the lab of one lesson as the learner's machine last synced it (the back end `courseLab` query). */
export const queryCourseLab = async ({
    request,
    signal,
}: QueryParams<CourseLabInput>): Promise<ApolloClient.QueryResult<CourseLabQuery>> => {
    const variables: InputVariables<CourseLabInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
