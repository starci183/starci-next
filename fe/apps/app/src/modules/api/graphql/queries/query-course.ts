import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { CourseCatalogInput, CourseQuery, CourseQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<CourseQuery, CourseQueryVariables> = gql`
    query Course($input: CourseCatalogInput!) {
        course(input: $input) {
            courseId
            title {
                vi
                en
            }
            summary {
                vi
                en
            }
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

/** Reads one course of the catalog with its lessons (the back end `course` query). */
export const queryCourse = async ({
    request,
    signal,
}: QueryParams<CourseCatalogInput>): Promise<ApolloClient.QueryResult<CourseQuery>> => {
    const variables: InputVariables<CourseCatalogInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables, fetchPolicy: "no-cache" })
}
