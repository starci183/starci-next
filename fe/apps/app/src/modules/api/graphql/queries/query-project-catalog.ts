import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { ProjectCatalogInput, ProjectCatalogQuery, ProjectCatalogQueryVariables } from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ProjectCatalogQuery, ProjectCatalogQueryVariables> = gql`
    query ProjectCatalog($input: ProjectCatalogInput!) {
        projectCatalog(input: $input) {
            milestones {
                id
                title
                concepts
                free
            }
            concepts {
                id
                label
                kind
                requires
                probes
                comingSoon
            }
            freeProjects
        }
    }
`

/** Reads the milestones and concepts a project can pursue (the back end `projectCatalog` query). */
export const queryProjectCatalog = async ({
    request,
    signal,
}: QueryParams<ProjectCatalogInput>): Promise<ApolloClient.QueryResult<ProjectCatalogQuery>> => {
    const variables: InputVariables<ProjectCatalogInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
