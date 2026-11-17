"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type IncidentsQuery } from "@/modules/api"
import { queryIncidents } from "@/modules/api/graphql/queries/query-incidents"

/** Cache identity of the incident list read; the viewer and the locale are part of the key. */
export const QUERY_INCIDENTS_SWR_KEY = "QUERY_INCIDENTS_SWR"

/** The rows of the incident list: a live lesson and whether its tier-2 incident is written. */
export type IncidentRows = IncidentsQuery["incidents"]

/** Reads the incident list in one locale; a failure stays the read's error, never an empty list. */
export const useQueryIncidentsSwr = (locale: string): SWRResponse<IncidentRows> => {
    const viewer = viewerKey(QUERY_INCIDENTS_SWR_KEY, useViewerId())
    return useSWR<IncidentRows>(viewer === null ? null : [...viewer, locale], async () => {
        const { data } = await failing(() => queryIncidents({ request: { locale, topic: null } }))
        if (data === undefined) throw new Error("incidents answered no data")
        return data.incidents
    })
}
