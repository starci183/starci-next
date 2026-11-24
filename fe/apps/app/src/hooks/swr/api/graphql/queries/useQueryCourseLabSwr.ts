"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing } from "@/modules/api"
import type { CourseLabRead } from "@/modules/course-lab"
import { queryCourseLab } from "@/modules/api/graphql/queries/query-course-lab"

/** Cache identity of the lab read; the viewer, the course and the lesson are part of the key. */
export const QUERY_COURSE_LAB_SWR_KEY = "QUERY_COURSE_LAB_SWR"

/** How often the lab is read again while the machine boots, a run or a grading is in flight: the panel follows the relay live. */
const BUSY_POLL_MS = 2000

/** How often the lab is read again while no machine is online, so a pairing or a restart shows up without a reload. */
const WAITING_POLL_MS = 3000

/** How often the lab is read again otherwise, so an edit saved in the editor shows up without a reload. */
const IDLE_POLL_MS = 8000

/** True while the machine or the grading is working on something the panel will show. */
const isBusy = (lab: CourseLabRead | undefined): boolean =>
    lab !== undefined &&
    (lab.phase === "booting" || lab.latestSubmission?.status === "queued" || lab.latestSubmission?.status === "running")

/**
 * Reads the lab of one lesson. `isEnabled` is false while there is no lesson to read; `isRequested` is true from a command (boot, tests,
 * chaos, submit) until its result lands, and reads every two seconds like a boot does.
 */
export const useQueryCourseLabSwr = (
    courseId: string,
    lessonId: string,
    isEnabled: boolean,
    isRequested: boolean,
): SWRResponse<CourseLabRead> => {
    const viewer = viewerKey(QUERY_COURSE_LAB_SWR_KEY, useViewerId())
    return useSWR<CourseLabRead>(
        viewer === null || !isEnabled ? null : [...viewer, courseId, lessonId],
        async () => {
            const { data } = await failing(() => queryCourseLab({ request: { courseId, lessonId } }))
            if (data === undefined) throw new Error("courseLab answered no data")
            return data.courseLab
        },
        {
            refreshInterval: (lab) => {
                if (isRequested || isBusy(lab)) return BUSY_POLL_MS
                return lab === undefined || lab.device !== "online" ? WAITING_POLL_MS : IDLE_POLL_MS
            },
        },
    )
}
