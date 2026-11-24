"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type CourseCasesQuery } from "@/modules/api"
import { queryCourseCases } from "@/modules/api/graphql/queries/query-course-cases"

/** Cache identity of the course cases read; the viewer and the lesson are part of the key. */
export const QUERY_COURSE_CASES_SWR_KEY = "QUERY_COURSE_CASES_SWR"

/** Where the learner stands in every case of one lesson. */
export type CourseCasesRead = CourseCasesQuery["courseCases"]

/** How often the cases are read again while the learner is on a loop: the relay uploads each case result a moment after the run. */
const LOOP_POLL_MS = 3000

/** How often the cases are read again on the other pages, where the learner only reads. */
const IDLE_POLL_MS = 15_000

/**
 * Reads where the learner stands in each case. `isOnLoop` is true while a loop page is on screen: the read then follows the relay every
 * three seconds, so a case turns red or green without a reload.
 */
export const useQueryCourseCasesSwr = (
    lessonId: string,
    isEnabled: boolean,
    isOnLoop: boolean,
): SWRResponse<CourseCasesRead> => {
    const viewer = viewerKey(QUERY_COURSE_CASES_SWR_KEY, useViewerId())
    return useSWR<CourseCasesRead>(
        viewer === null || !isEnabled ? null : [...viewer, lessonId],
        async () => {
            const { data } = await failing(() => queryCourseCases({ request: { lessonId } }))
            if (data === undefined) throw new Error("courseCases answered no data")
            return data.courseCases
        },
        { refreshInterval: isOnLoop ? LOOP_POLL_MS : IDLE_POLL_MS },
    )
}
