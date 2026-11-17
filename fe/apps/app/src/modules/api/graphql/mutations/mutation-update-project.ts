import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    UpdateProjectInput,
    UpdateProjectMutation,
    UpdateProjectMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<UpdateProjectMutation, UpdateProjectMutationVariables> = gql`
    mutation UpdateProject($input: UpdateProjectInput!) {
        updateProject(input: $input) {
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
    }
`

/** Changes a project of the signed-in learner. */
export const mutateUpdateProject = async ({
    request,
    signal,
}: QueryParams<UpdateProjectInput>): Promise<ApolloClient.MutateResult<UpdateProjectMutation>> => {
    const variables: InputVariables<UpdateProjectInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
