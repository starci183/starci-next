"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type InterviewHistoryQuery } from "@/modules/api"
import { queryInterviewHistory } from "@/modules/api/graphql/queries/query-interview-history"

/** Cache identity of the interview history read; the viewer is part of the key. */
export const QUERY_INTERVIEW_HISTORY_SWR_KEY = "QUERY_INTERVIEW_HISTORY_SWR"

/** What the interview history read answers. */
export type InterviewHistoryRead = InterviewHistoryQuery["interviewHistory"]

/** Reads the interview history; a failure stays the read's error, never an empty answer. */
export const useQueryInterviewHistorySwr = (): SWRResponse<InterviewHistoryRead> => {
    const viewer = viewerKey(QUERY_INTERVIEW_HISTORY_SWR_KEY, useViewerId())
    return useSWR<InterviewHistoryRead>(viewer === null ? null : [...viewer], async () => {
        const { data } = await failing(() => queryInterviewHistory({ request: { track: null } }))
        if (data === undefined) throw new Error("interviewHistory answered no data")
        return data.interviewHistory
    })
}
