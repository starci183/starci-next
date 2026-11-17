import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    CreateProjectInput,
    CreateProjectMutation,
    CreateProjectMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<CreateProjectMutation, CreateProjectMutationVariables> = gql`
    mutation CreateProject($input: CreateProjectInput!) {
        createProject(input: $input) {
            project {
                id
                name
                kind
                topic
                language
                stack
                track
                repoUrl
                deployedUrl
                provedConceptCount
                conceptCount
                currentMilestoneId
                doneMilestoneCount
                milestoneCount
                createdAt
            }
            ciSecret
        }
    }
`

/** Creates a project and answers it with its CI secret, shown once. */
export const mutateCreateProject = async ({
    request,
    signal,
}: QueryParams<CreateProjectInput>): Promise<ApolloClient.MutateResult<CreateProjectMutation>> => {
    const variables: InputVariables<CreateProjectInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
