import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { ProjectCodeReadQuery, ProjectCodeReadQueryVariables, ProjectConceptInput } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ProjectCodeReadQuery, ProjectCodeReadQueryVariables> = gql`
    query ProjectCodeRead($input: ProjectConceptInput!) {
        projectCodeRead(input: $input) {
            projectId
            conceptId
            location
            passed
            mean
            gradedAt
            question
            criteria {
                criterionId
                criterion
                level
                verdict
                evidenceQuote
            }
        }
    }
`

/** Reads the latest AI code read of one concept of a project, with its rubric (the back end `projectCodeRead` query). */
export const queryProjectCodeRead = async ({
    request,
    signal,
}: QueryParams<ProjectConceptInput>): Promise<ApolloClient.QueryResult<ProjectCodeReadQuery>> => {
    const variables: InputVariables<ProjectConceptInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
