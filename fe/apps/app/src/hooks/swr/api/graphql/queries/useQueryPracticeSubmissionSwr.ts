"use client"

import { viewerKey } from "@starci/next-data"
import { useState } from "react"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import { queryPracticeSubmission } from "@/modules/api/graphql/queries/query-practice-submission"
import { practiceSubmissionOf } from "@/modules/practice-view"
import type { PracticeSubmissionView } from "@/modules/types"

/** Cache identity of the submission read; the viewer and the submission are part of the key. */
export const QUERY_PRACTICE_SUBMISSION_SWR_KEY = "QUERY_PRACTICE_SUBMISSION_SWR"

/** The wait before the next poll, by how many reads were made: 1 s growing to 4 s. */
const POLL_DELAYS_MS = [1_000, 1_000, 2_000, 3_000, 4_000] as const

/** The most reads a queued submission is polled for (about three minutes); after it the page keeps its last answer. */
const POLL_CAP = 60

/** True while the judge has not settled the submission. */
const isUnsettled = (submission: PracticeSubmissionView | undefined): boolean =>
    submission?.verdict === "QUEUED" || submission?.verdict === "RUNNING"

/**
 * Reads one run or submission and polls it while the judge is still on it, with a growing wait and a cap. A settled verdict
 * stops the polling; no submission id leaves the read idle.
 */
export const useQueryPracticeSubmissionSwr = (
    submissionId: string | undefined,
): SWRResponse<PracticeSubmissionView> => {
    const viewer = viewerKey(QUERY_PRACTICE_SUBMISSION_SWR_KEY, useViewerId())
    const [reads, setReads] = useState(0)
    return useSWR<PracticeSubmissionView>(
        viewer === null || submissionId === undefined ? null : [...viewer, submissionId],
        async () => {
            const { data } = await failing(() =>
                queryPracticeSubmission({ request: { submissionId: submissionId ?? "" } }),
            )
            if (data === undefined) throw new Error("practiceSubmission answered no data")
            return practiceSubmissionOf(data.practiceSubmission)
        },
        {
            shouldRetryOnError: false,
            onSuccess: () => {
                setReads((count) => count + 1)
            },
            refreshInterval: (latest: PracticeSubmissionView | undefined): number => {
                if (!isUnsettled(latest) || reads >= POLL_CAP) return 0
                return POLL_DELAYS_MS[Math.min(reads, POLL_DELAYS_MS.length - 1)] ?? 0
            },
        },
    )
}
