import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { IssueRelayPairCodeMutation, IssueRelayPairCodeMutationVariables } from "../__generated__/graphql"

const mutation1: TypedDocumentNode<IssueRelayPairCodeMutation, IssueRelayPairCodeMutationVariables> = gql`
    mutation IssueRelayPairCode {
        issueRelayPairCode {
            code
            expiresAt
        }
    }
`

/** Params of {@link mutateIssueRelayPairCode}. */
interface MutateIssueRelayPairCodeParams {
    readonly signal?: AbortSignal | undefined
}

/** Issues the one-use code that pairs a machine with `starci-relay pair <code>` (the back end `issueRelayPairCode` mutation). */
export const mutateIssueRelayPairCode = async ({ signal }: MutateIssueRelayPairCodeParams = {}): Promise<
    ApolloClient.MutateResult<IssueRelayPairCodeMutation>
> => createApolloClient({ signal }).mutate({ mutation: mutation1 })
