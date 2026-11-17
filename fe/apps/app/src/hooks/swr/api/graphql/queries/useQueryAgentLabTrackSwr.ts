"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type AgentLabTrackQuery } from "@/modules/api"
import { queryAgentLabTrack } from "@/modules/api/graphql/queries/query-agent-lab-track"

/** Cache identity of the agent lab track read; the viewer, the track and the locale are part of the key. */
export const QUERY_AGENT_LAB_TRACK_SWR_KEY = "QUERY_AGENT_LAB_TRACK_SWR"

/** One tool track with the grid of its labs. */
export type AgentLabTrack = AgentLabTrackQuery["agentLabTrack"]

/** Reads one tool track in one locale; an unknown track stays the read's error with the stable code AGENT_LAB_TRACK_NOT_FOUND. */
export const useQueryAgentLabTrackSwr = (trackId: string, locale: string): SWRResponse<AgentLabTrack> => {
    const viewer = viewerKey(QUERY_AGENT_LAB_TRACK_SWR_KEY, useViewerId())
    return useSWR<AgentLabTrack>(viewer === null ? null : [...viewer, trackId, locale], async () => {
        const { data } = await failing(() => queryAgentLabTrack({ request: { trackId, locale } }))
        if (data === undefined) throw new Error("agentLabTrack answered no data")
        return data.agentLabTrack
    })
}
