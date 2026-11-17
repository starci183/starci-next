import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type {
    RotateProjectCiSecretInput,
    RotateProjectCiSecretMutation,
    RotateProjectCiSecretMutationVariables,
} from "../__generated__/graphql"
import type { InputVariables, QueryParams } from "../types"

const mutation1: TypedDocumentNode<RotateProjectCiSecretMutation, RotateProjectCiSecretMutationVariables> = gql`
    mutation RotateProjectCiSecret($input: RotateProjectCiSecretInput!) {
        rotateProjectCiSecret(input: $input) {
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

/** Replaces the CI secret of a project and answers the new one, shown once. */
export const mutateRotateProjectCiSecret = async ({
    request,
    signal,
}: QueryParams<RotateProjectCiSecretInput>): Promise<ApolloClient.MutateResult<RotateProjectCiSecretMutation>> => {
    const variables: InputVariables<RotateProjectCiSecretInput> = { input: request }
    return createApolloClient({ signal }).mutate({ mutation: mutation1, variables })
}
