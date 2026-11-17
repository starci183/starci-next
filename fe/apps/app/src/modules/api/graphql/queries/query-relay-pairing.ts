import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { RelayPairingQuery, RelayPairingQueryVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<RelayPairingQuery, RelayPairingQueryVariables>

const query1: Document = gql`
    query RelayPairing($input: RelayUserCodeInput!) {
        relayPairing(input: $input) {
            name
            platform
            expiresAt
        }
    }
`

/** What the read takes: the code the learner typed and the abort signal. */
interface QueryRelayPairingParams {
    readonly userCode: string
    readonly signal?: AbortSignal | undefined
}

/** Reads the device name and platform of a pending pairing, so the learner sees what they confirm. */
export const queryRelayPairing = async ({
    userCode,
    signal,
}: QueryRelayPairingParams): Promise<ApolloClient.QueryResult<RelayPairingQuery>> =>
    createApolloClient({ signal }).query({ query: query1, variables: { input: { userCode } }, fetchPolicy: "no-cache" })
