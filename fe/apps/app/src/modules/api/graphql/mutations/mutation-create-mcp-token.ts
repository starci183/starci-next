import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { CreateMcpTokenMutation, CreateMcpTokenMutationVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<CreateMcpTokenMutation, CreateMcpTokenMutationVariables>

const mutation1: Document = gql`
    mutation CreateMcpToken($input: CreateMcpTokenInput!) {
        createMcpToken(input: $input) {
            id
            name
            hint
            createdAt
            lastUsedAt
            secret
        }
    }
`

/** What the create takes: the name for the token and the abort signal. */
interface MutateCreateMcpTokenParams {
    readonly name: string
    readonly signal?: AbortSignal | undefined
}

/** Creates an access token for the signed-in learner; the secret is in this answer only. */
export const mutateCreateMcpToken = async ({
    name,
    signal,
}: MutateCreateMcpTokenParams): Promise<ApolloClient.MutateResult<CreateMcpTokenMutation>> =>
    createApolloClient({ signal }).mutate({ mutation: mutation1, variables: { input: { name } } })
