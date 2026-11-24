"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type CoursesQuery } from "@/modules/api"
import { queryCourses } from "@/modules/api/graphql/queries/query-courses"

/** Cache identity of the course catalog read; the viewer is part of the key. */
export const QUERY_COURSES_SWR_KEY = "QUERY_COURSES_SWR"

/** The course catalog: every course with its lessons. */
export type CoursesRead = CoursesQuery["courses"]

/** Reads the course catalog. */
export const useQueryCoursesSwr = (isEnabled: boolean): SWRResponse<CoursesRead> => {
    const viewer = viewerKey(QUERY_COURSES_SWR_KEY, useViewerId())
    return useSWR<CoursesRead>(viewer === null || !isEnabled ? null : viewer, async () => {
        const { data } = await failing(() => queryCourses())
        if (data === undefined) throw new Error("courses answered no data")
        return data.courses
    })
}
