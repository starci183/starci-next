import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { RevokeRelayDeviceMutation, RevokeRelayDeviceMutationVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<RevokeRelayDeviceMutation, RevokeRelayDeviceMutationVariables>

const mutation1: Document = gql`
    mutation RevokeRelayDevice($input: RevokeRelayDeviceInput!) {
        revokeRelayDevice(input: $input) {
            id
        }
    }
`

/** What the revoke takes: the device id and the abort signal. */
interface MutateRevokeRelayDeviceParams {
    readonly id: string
    readonly signal?: AbortSignal | undefined
}

/** Revokes one of the signed-in learner's devices; its token stops working at once. */
export const mutateRevokeRelayDevice = async ({
    id,
    signal,
}: MutateRevokeRelayDeviceParams): Promise<ApolloClient.MutateResult<RevokeRelayDeviceMutation>> =>
    createApolloClient({ signal }).mutate({ mutation: mutation1, variables: { input: { id } } })
