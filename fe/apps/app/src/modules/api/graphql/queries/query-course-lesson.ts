import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { CourseLessonInput, CourseLessonQuery, CourseLessonQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<CourseLessonQuery, CourseLessonQueryVariables> = gql`
    query CourseLesson($input: CourseLessonInput!) {
        courseLesson(input: $input) {
            lessonId
            version
            lab
            concept
            requires
            allowedTerms {
                id
                term
            }
            stack {
                language
                runtime
                test
                services {
                    id
                    port
                    db
                    uses
                    role {
                        vi
                        en
                    }
                }
                deps {
                    id
                    image
                    role {
                        vi
                        en
                    }
                }
            }
            learnerFile
            invariants {
                id
                vi
                en
            }
            happy {
                id
                title {
                    vi
                    en
                }
                chaos {
                    key
                    value
                }
                invariants
                teaches
                hints {
                    level
                    text
                    unlocked
                }
                hasReference
            }
            unhappy {
                id
                title {
                    vi
                    en
                }
                chaos {
                    key
                    value
                }
                invariants
                teaches
                hints {
                    level
                    text
                    unlocked
                }
                hasReference
            }
            grader {
                steps
                faults
            }
            nestjs {
                from
                to
            }
        }
    }
`

/** Reads the record of one course lesson in the learner's language (the back end `courseLesson` query). */
export const queryCourseLesson = async ({
    request,
    signal,
}: QueryParams<CourseLessonInput>): Promise<ApolloClient.QueryResult<CourseLessonQuery>> => {
    const variables: InputVariables<CourseLessonInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
