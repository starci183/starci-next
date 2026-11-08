import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { ConfirmRelayDeviceMutation, ConfirmRelayDeviceMutationVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<ConfirmRelayDeviceMutation, ConfirmRelayDeviceMutationVariables>

const mutation1: Document = gql`
    mutation ConfirmRelayDevice($input: RelayUserCodeInput!) {
        confirmRelayDevice(input: $input) {
            id
            name
            platform
        }
    }
`

/** What the confirm takes: the code the learner typed and the abort signal. */
interface MutateConfirmRelayDeviceParams {
    readonly userCode: string
    readonly signal?: AbortSignal | undefined
}

/** Confirms a pending pairing for the signed-in learner; the CLI then takes its own token. */
export const mutateConfirmRelayDevice = async ({
    userCode,
    signal,
}: MutateConfirmRelayDeviceParams): Promise<ApolloClient.MutateResult<ConfirmRelayDeviceMutation>> =>
    createApolloClient({ signal }).mutate({ mutation: mutation1, variables: { input: { userCode } } })
