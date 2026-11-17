import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { MarkNotificationsReadMutation, MarkNotificationsReadMutationVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<MarkNotificationsReadMutation, MarkNotificationsReadMutationVariables>

const mutation1: Document = gql`
    mutation MarkNotificationsRead($input: MarkNotificationsReadInput!) {
        markNotificationsRead(input: $input)
    }
`

/** What the mutation takes: the ids to mark, or `all`, and the abort signal. */
interface MutateMarkNotificationsReadParams {
    readonly ids?: ReadonlyArray<string> | undefined
    readonly all?: boolean | undefined
    readonly signal?: AbortSignal | undefined
}

/** Marks some of the reader's notifications (or all of them) read; answers how many changed. */
export const mutateMarkNotificationsRead = async ({
    ids,
    all,
    signal,
}: MutateMarkNotificationsReadParams): Promise<ApolloClient.MutateResult<MarkNotificationsReadMutation>> =>
    createApolloClient({ signal }).mutate({
        mutation: mutation1,
        variables: {
            input: all === true ? { all: true, ids: null } : { all: null, ids: ids === undefined ? [] : [...ids] },
        },
    })
