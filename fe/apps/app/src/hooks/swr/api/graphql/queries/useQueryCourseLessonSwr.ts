"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type CourseLessonAuditQuery, type CourseLessonQuery } from "@/modules/api"
import { queryCourseLesson, queryCourseLessonAudit } from "@/modules/api/graphql/queries/query-course-lesson"

/** Cache identity of the course lesson read; the viewer, the lesson and the language are part of the key. */
export const QUERY_COURSE_LESSON_SWR_KEY = "QUERY_COURSE_LESSON_SWR"

/** The record of one course lesson as the back end answers it. */
export type CourseLessonRead = CourseLessonQuery["courseLesson"]

/**
 * Reads the record of one course lesson in the learner's language: the stack, the cases with the hints the learner opened, the
 * invariants and the map to the framework version. `isEnabled` is false while there is no lesson to read or nobody is signed in.
 */
export const useQueryCourseLessonSwr = (
    lessonId: string,
    locale: string,
    isEnabled: boolean,
): SWRResponse<CourseLessonRead> => {
    const viewer = viewerKey(QUERY_COURSE_LESSON_SWR_KEY, useViewerId())
    return useSWR<CourseLessonRead>(viewer === null || !isEnabled ? null : [...viewer, lessonId, locale], async () => {
        const { data } = await failing(() => queryCourseLesson({ request: { lessonId, locale } }))
        if (data === undefined) throw new Error("courseLesson answered no data")
        return data.courseLesson
    })
}

/** Cache identity of the lesson's audit read. */
export const QUERY_COURSE_LESSON_AUDIT_SWR_KEY = "QUERY_COURSE_LESSON_AUDIT_SWR"

/** The stored audit of one course lesson as the back end answers it. */
export type CourseLessonAuditRead = CourseLessonAuditQuery["courseLesson"]["audit"]

/** Reads the stored audit of one lesson; `isEnabled` is true only on the dev-only Audit tab. */
export const useQueryCourseLessonAuditSwr = (
    lessonId: string,
    locale: string,
    isEnabled: boolean,
): SWRResponse<CourseLessonAuditRead> => {
    const viewer = viewerKey(QUERY_COURSE_LESSON_AUDIT_SWR_KEY, useViewerId())
    return useSWR<CourseLessonAuditRead>(viewer === null || !isEnabled ? null : [...viewer, lessonId, locale], async () => {
        const { data } = await failing(() => queryCourseLessonAudit({ request: { lessonId, locale } }))
        if (data === undefined) throw new Error("courseLesson answered no audit data")
        return data.courseLesson.audit
    })
}
