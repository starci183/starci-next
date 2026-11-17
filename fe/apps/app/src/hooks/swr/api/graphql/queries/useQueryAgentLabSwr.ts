"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type AgentLabQuery } from "@/modules/api"
import { queryAgentLab } from "@/modules/api/graphql/queries/query-agent-lab"

/** Cache identity of the agent lab overview read; the viewer and the locale are part of the key. */
export const QUERY_AGENT_LAB_SWR_KEY = "QUERY_AGENT_LAB_SWR"

/** The tracks and the seven mindset concepts of the agent lab. */
export type AgentLabOverview = AgentLabQuery["agentLab"]

/** Reads the agent lab overview in one locale. */
export const useQueryAgentLabSwr = (locale: string): SWRResponse<AgentLabOverview> => {
    const viewer = viewerKey(QUERY_AGENT_LAB_SWR_KEY, useViewerId())
    const read = async (): Promise<AgentLabOverview> => {
        const result = await failing(() => queryAgentLab({ request: { locale } }))
        if (result.data === undefined) throw new Error("agentLab answered no data")
        return result.data.agentLab
    }
    return useSWR<AgentLabOverview>(viewer === null ? null : [...viewer, locale], read)
}
