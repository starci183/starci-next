import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { AgentQuotaQuery, AgentQuotaQueryVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<AgentQuotaQuery, AgentQuotaQueryVariables>

const query1: Document = gql`
    query AgentQuota {
        agentQuota {
            limit
            used
            remaining
            exhausted
            resetsAt
        }
    }
`

/** What the read takes: the abort signal SWR hands the fetcher. */
interface QueryAgentQuotaParams {
    readonly signal?: AbortSignal | undefined
}

/** Reads how many model calls the signed-in reader has left today on the capped proxy key (the back end `agentQuota` query). */
export const queryAgentQuota = async ({ signal }: QueryAgentQuotaParams = {}): Promise<
    ApolloClient.QueryResult<AgentQuotaQuery>
> => createApolloClient({ signal }).query({ query: query1 })
