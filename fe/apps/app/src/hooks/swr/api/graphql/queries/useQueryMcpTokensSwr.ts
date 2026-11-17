"use client"

import useSWR, { type SWRResponse } from "swr"
import { failing, type McpTokensQuery } from "@/modules/api"
import { queryMcpTokens } from "@/modules/api/graphql/queries/query-mcp-tokens"

/** Cache identity of the connection read; the SWR cache is already scoped to the viewer on screen. */
export const QUERY_MCP_TOKENS_SWR_KEY = "QUERY_MCP_TOKENS_SWR"

/** The endpoint and the learner access tokens as the connect screen reads them. */
export type McpConnection = McpTokensQuery

/** Reads the endpoint and the tokens; `isEnabled` is false while there is no session, since the door needs one. */
export const useQueryMcpTokensSwr = (isEnabled: boolean): SWRResponse<McpConnection> =>
    useSWR<McpConnection>(isEnabled ? QUERY_MCP_TOKENS_SWR_KEY : null, async () => {
        const { data } = await failing(() => queryMcpTokens())
        if (data === undefined) throw new Error("mcpTokens answered no data")
        return data
    })
