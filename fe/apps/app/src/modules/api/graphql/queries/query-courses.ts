import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { CoursesQuery, CoursesQueryVariables } from "../__generated__/graphql"

const query1: TypedDocumentNode<CoursesQuery, CoursesQueryVariables> = gql`
    query Courses {
        courses {
            courseId
            title {
                vi
                en
            }
            summary {
                vi
                en
            }
            description {
                vi
                en
            }
            order
            lessons {
                lessonId
                concept
                conceptTerm
                available
                title {
                    vi
                    en
                }
            }
        }
    }
`

/** Reads the course catalog: every course with its lessons (the back end `courses` query). */
export const queryCourses = async ({ signal }: { readonly signal?: AbortSignal | undefined } = {}): Promise<
    ApolloClient.QueryResult<CoursesQuery>
> => createApolloClient({ signal }).query({ query: query1, fetchPolicy: "no-cache" })
