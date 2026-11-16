import { gql, type ApolloClient, type TypedDocumentNode } from "@apollo/client"
import { createApolloClient } from "../clients"
import type { McpTokensQuery, McpTokensQueryVariables } from "../__generated__/graphql"

type Document = TypedDocumentNode<McpTokensQuery, McpTokensQueryVariables>

const query1: Document = gql`
    query McpTokens {
        mcpConnectInfo {
            endpoint
            tokenLimit
        }
        mcpTokens {
            id
            name
            hint
            createdAt
            lastUsedAt
        }
    }
`

/** What the read takes: the abort signal SWR hands the fetcher. */
interface QueryMcpTokensParams {
    readonly signal?: AbortSignal | undefined
}

/** Reads where the MCP endpoint is and the signed-in learner access tokens; never a secret. */
export const queryMcpTokens = async ({ signal }: QueryMcpTokensParams = {}): Promise<
    ApolloClient.QueryResult<McpTokensQuery>
> => createApolloClient({ signal }).query({ query: query1, fetchPolicy: "no-cache" })
