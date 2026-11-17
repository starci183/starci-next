import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    ProjectCvPreviewInput,
    ProjectCvPreviewQuery,
    ProjectCvPreviewQueryVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const query1: TypedDocumentNode<ProjectCvPreviewQuery, ProjectCvPreviewQueryVariables> = gql`
    query ProjectCvPreview($input: ProjectCvPreviewInput!) {
        projectCvPreview(input: $input) {
            projectId
            subjectKind
            subjectId
            proved
            text
            evidence {
                kind
                proofForm
                ref
                at
            }
        }
    }
`

/** Reads the CV line a concept or a milestone of a project gives once proved, with the evidence it stands on (the back end `projectCvPreview` query). */
export const queryProjectCvPreview = async ({
    request,
    signal,
}: QueryParams<ProjectCvPreviewInput>): Promise<ApolloClient.QueryResult<ProjectCvPreviewQuery>> => {
    const variables: InputVariables<ProjectCvPreviewInput> = { input: request }
    return createApolloClient({ signal }).query({ query: query1, variables })
}
