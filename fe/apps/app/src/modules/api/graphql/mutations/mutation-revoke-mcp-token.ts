import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { RevokeMcpTokenMutation, RevokeMcpTokenMutationVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<RevokeMcpTokenMutation, RevokeMcpTokenMutationVariables>

const mutation1: Document = gql`
    mutation RevokeMcpToken($input: RevokeMcpTokenInput!) {
        revokeMcpToken(input: $input)
    }
`

/** What the revoke takes: the token id and the abort signal. */
interface MutateRevokeMcpTokenParams {
    readonly id: string
    readonly signal?: AbortSignal | undefined
}

/** Revokes one access token of the signed-in learner; it stops working at once. */
export const mutateRevokeMcpToken = async ({
    id,
    signal,
}: MutateRevokeMcpTokenParams): Promise<ApolloClient.MutateResult<RevokeMcpTokenMutation>> =>
    createApolloClient({ signal }).mutate({ mutation: mutation1, variables: { input: { id } } })
