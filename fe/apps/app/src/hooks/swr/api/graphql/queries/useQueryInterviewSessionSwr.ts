"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type InterviewSessionQuery } from "@/modules/api"
import { queryInterviewSession } from "@/modules/api/graphql/queries/query-interview-session"

/** Cache identity of the interview session read; the viewer is part of the key. */
export const QUERY_INTERVIEW_SESSION_SWR_KEY = "QUERY_INTERVIEW_SESSION_SWR"

/** How often a session that is being graded is read again, in milliseconds. */
const REFRESH_MS = 3000

/** What the interview session read answers. */
export type InterviewSessionRead = InterviewSessionQuery["interviewSession"]

/** Reads the interview session, again while it is being graded; a failure stays the read's error, never an empty answer. */
export const useQueryInterviewSessionSwr = (sessionId: string): SWRResponse<InterviewSessionRead> => {
    const viewer = viewerKey(QUERY_INTERVIEW_SESSION_SWR_KEY, useViewerId())
    return useSWR<InterviewSessionRead>(
        viewer === null ? null : [...viewer, sessionId],
        async () => {
            const { data } = await failing(() => queryInterviewSession({ request: { sessionId } }))
            if (data === undefined) throw new Error("interviewSession answered no data")
            return data.interviewSession
        },
        {
            // The room and the report read the same session: a fresh read on every mount, never the one the room made seconds ago
            // (a deduplicated read kept the "in progress" status after a submit and showed a failed grading as not submitted).
            dedupingInterval: 0,
            revalidateOnMount: true,
            refreshInterval: (latest) =>
                latest?.status === "grading" || latest?.status === "submitted" ? REFRESH_MS : 0,
        },
    )
}
