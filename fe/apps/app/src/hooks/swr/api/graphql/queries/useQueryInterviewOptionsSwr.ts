"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type InterviewOptionsQuery } from "@/modules/api"
import { queryInterviewOptions } from "@/modules/api/graphql/queries/query-interview-options"

/** Cache identity of the interview home options read; the viewer is part of the key. */
export const QUERY_INTERVIEW_OPTIONS_SWR_KEY = "QUERY_INTERVIEW_OPTIONS_SWR"

/** What the interview home options read answers. */
export type InterviewOptionsRead = InterviewOptionsQuery["interviewOptions"]

/** Reads the interview home options; a failure stays the read's error, never an empty answer. */
export const useQueryInterviewOptionsSwr = (
    locale: string,
    track: string | null,
): SWRResponse<InterviewOptionsRead> => {
    const viewer = viewerKey(QUERY_INTERVIEW_OPTIONS_SWR_KEY, useViewerId())
    return useSWR<InterviewOptionsRead>(viewer === null ? null : [...viewer, locale, track ?? ""], async () => {
        const { data } = await failing(() =>
            queryInterviewOptions({ request: { locale: locale === "en" ? "en" : "vi", track } }),
        )
        if (data === undefined) throw new Error("interviewOptions answered no data")
        return data.interviewOptions
    })
}
