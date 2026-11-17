"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type AgentQuotaQuery } from "@/modules/api"
import { queryAgentQuota } from "@/modules/api/graphql/queries/query-agent-quota"

/** Cache identity of the agent quota read; the viewer is part of the key because the count is per learner. */
export const QUERY_AGENT_QUOTA_SWR_KEY = "QUERY_AGENT_QUOTA_SWR"

/** The model calls the reader has left today on the capped proxy key. */
export type AgentQuota = AgentQuotaQuery["agentQuota"]

/** Reads the daily model-call quota of the signed-in reader. */
export const useQueryAgentQuotaSwr = (): SWRResponse<AgentQuota> => {
    const viewer = viewerKey(QUERY_AGENT_QUOTA_SWR_KEY, useViewerId())
    const read = async (): Promise<AgentQuota> => {
        const result = await failing(() => queryAgentQuota())
        if (result.data === undefined) throw new Error("agentQuota answered no data")
        return result.data.agentQuota
    }
    return useSWR<AgentQuota>(viewer, read)
}
