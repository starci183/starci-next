"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type CourseQuery } from "@/modules/api"
import { queryCourse } from "@/modules/api/graphql/queries/query-course"

/** Cache identity of the one-course read; the viewer and the course are part of the key. */
export const QUERY_COURSE_SWR_KEY = "QUERY_COURSE_SWR"

/** One course of the catalog with its lessons. */
export type CourseRead = CourseQuery["course"]

/** Reads one course of the catalog; `isEnabled` is false while there is no course to read. */
export const useQueryCourseSwr = (courseId: string, isEnabled: boolean): SWRResponse<CourseRead> => {
    const viewer = viewerKey(QUERY_COURSE_SWR_KEY, useViewerId())
    return useSWR<CourseRead>(viewer === null || !isEnabled ? null : [...viewer, courseId], async () => {
        const { data } = await failing(() => queryCourse({ request: { courseId } }))
        if (data === undefined) throw new Error("course answered no data")
        return data.course
    })
}
