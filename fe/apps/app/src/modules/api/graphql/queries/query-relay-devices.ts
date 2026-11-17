import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { RelayDevicesQuery, RelayDevicesQueryVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<RelayDevicesQuery, RelayDevicesQueryVariables>

const query1: Document = gql`
    query RelayDevices {
        relayDevices {
            id
            name
            platform
            pairedAt
            lastSeenAt
            online
        }
    }
`

/** What the read takes: the abort signal SWR hands the fetcher. */
interface QueryRelayDevicesParams {
    readonly signal?: AbortSignal | undefined
}

/** Reads the signed-in learner's paired devices, newest first. */
export const queryRelayDevices = async ({ signal }: QueryRelayDevicesParams = {}): Promise<
    ApolloClient.QueryResult<RelayDevicesQuery>
> => createApolloClient({ signal }).query({ query: query1, fetchPolicy: "no-cache" })
