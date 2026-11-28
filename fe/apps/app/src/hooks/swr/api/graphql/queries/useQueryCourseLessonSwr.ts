"use client"

import { viewerKey } from "@starci/next-data"
import useSWR, { type SWRResponse } from "swr"
import { useViewerId } from "@/hooks/viewer"
import { failing, type CourseLessonAuditQuery, type CourseLessonBeforeAfterQuery, type CourseLessonQuery } from "@/modules/api"
import {
    queryCourseLesson,
    queryCourseLessonAudit,
    queryCourseLessonBeforeAfter,
} from "@/modules/api/graphql/queries/query-course-lesson"

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

/** Cache identity of the lesson's before-and-after read. */
export const QUERY_COURSE_LESSON_BEFORE_AFTER_SWR_KEY = "QUERY_COURSE_LESSON_BEFORE_AFTER_SWR"

/** The before-and-after block of every unhappy case of one lesson, as the back end answers it. */
export type CourseLessonBeforeAfterRead = CourseLessonBeforeAfterQuery["courseLesson"]["unhappy"]

/**
 * Reads the before-and-after block of every unhappy case of one lesson; `isEnabled` is true only on a loop page. `progressKey` names where
 * the learner stands (each case's green and opened hints): the server reveals a case's fix once it is green or its solution is opened, so
 * a new key reads the block again at that moment and never on every poll of the cases.
 */
export const useQueryCourseLessonBeforeAfterSwr = (
    lessonId: string,
    locale: string,
    progressKey: string,
    isEnabled: boolean,
): SWRResponse<CourseLessonBeforeAfterRead> => {
    const viewer = viewerKey(QUERY_COURSE_LESSON_BEFORE_AFTER_SWR_KEY, useViewerId())
    return useSWR<CourseLessonBeforeAfterRead>(
        viewer === null || !isEnabled ? null : [...viewer, lessonId, locale, progressKey],
        async () => {
            const { data } = await failing(() => queryCourseLessonBeforeAfter({ request: { lessonId, locale } }))
            if (data === undefined) throw new Error("courseLesson answered no before-and-after data")
            return data.courseLesson.unhappy
        },
    )
}
