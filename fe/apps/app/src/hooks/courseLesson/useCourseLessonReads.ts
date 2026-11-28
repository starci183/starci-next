"use client"

import { useCallback, useMemo } from "react"
import { useSession } from "@/hooks/auth"
import {
    useQueryCourseCasesSwr,
    useQueryCourseLabSwr,
    useQueryCourseLessonAuditSwr,
    useQueryCourseLessonBeforeAfterSwr,
    useQueryCourseLessonSwr,
    useQueryCourseSwr,
    type CourseLessonBeforeAfterRead,
    type CourseRead,
} from "@/hooks/swr"
import type { CourseCasesRecord, CourseLessonRecord } from "@/modules/course-lesson"

/** What the lesson page reads: the record, where the learner stands in each case and how far the lab on their machine is. */
export type CourseLessonReads = {
    readonly lesson: CourseLessonRecord | undefined
    /** The course of the catalog the lesson belongs to; undefined while it is read or when the catalog does not answer. */
    readonly course: CourseRead | undefined
    readonly marks: CourseCasesRecord | undefined
    /** The phase of the lab on the learner's machine; undefined until it is read (or when the plan lacks the lab). */
    readonly labPhase: string | undefined
    /** True when the newest submission of the learner's code passed the hidden grader. */
    readonly isPassed: boolean
    readonly error: unknown
    readonly isLoading: boolean
    readonly isValidating: boolean
    /** Reads the record and the cases again. */
    readonly refresh: () => void
}

/** The lesson with each unhappy case's before-and-after block merged in by case id, once its own read answered. */
const withBeforeAfter = (
    lesson: CourseLessonRecord | undefined,
    blocks: CourseLessonBeforeAfterRead | undefined,
): CourseLessonRecord | undefined => {
    if (lesson === undefined || blocks === undefined) return lesson
    const blockOf = new Map(blocks.map((each) => [each.id, each.beforeAfter] as const))
    return {
        ...lesson,
        unhappy: lesson.unhappy.map((each) => (blockOf.has(each.id) ? { ...each, beforeAfter: blockOf.get(each.id) ?? null } : each)),
    }
}

/**
 * The three reads of the lesson page. The cases are read every few seconds while a loop is on screen (the relay uploads each run a moment
 * after it), and the lab is read for the one fact the pages after the setup need: whether the machine finished setting it up.
 */
export const useCourseLessonReads = (
    courseId: string,
    lessonId: string,
    locale: string,
    isOnLoop: boolean,
    isOnAudit = false,
): CourseLessonReads => {
    const isSignedIn = useSession().status === "signed-in"
    const course = useQueryCourseSwr(courseId, isSignedIn).data
    const lessonRead = useQueryCourseLessonSwr(lessonId, locale, isSignedIn)
    // The audit has its own query (the lesson query stays under the API's field cap), read only on the dev-only Audit tab.
    const auditRead = useQueryCourseLessonAuditSwr(lessonId, locale, isSignedIn && isOnAudit)
    const record = useMemo(
        () => (lessonRead.data === undefined || auditRead.data === undefined ? lessonRead.data : { ...lessonRead.data, audit: auditRead.data }),
        [lessonRead.data, auditRead.data],
    )
    const casesRead = useQueryCourseCasesSwr(lessonId, isSignedIn && record !== undefined, isOnLoop)
    // The before-and-after block has its own query too (the lesson query is at the field cap), read only on a loop page and again each
    // time a case turns green or its solution is opened, the moments the server reveals a fix (owner 2026-11-28).
    const progressKey = (casesRead.data?.cases ?? [])
        .map((each) => `${each.caseId}:${each.everGreen ? "1" : "0"}:${each.solutionOpened ? "1" : "0"}`)
        .join(",")
    const beforeAfterRead = useQueryCourseLessonBeforeAfterSwr(
        lessonId,
        locale,
        progressKey,
        isSignedIn && isOnLoop && casesRead.data !== undefined,
    )
    const lesson = useMemo(() => withBeforeAfter(record, beforeAfterRead.data), [record, beforeAfterRead.data])
    const labRead = useQueryCourseLabSwr(lesson?.lab ?? "", lessonId, isSignedIn && lesson !== undefined, false)
    const { mutate: refreshLesson } = lessonRead
    const { mutate: refreshCases } = casesRead
    const refresh = useCallback((): void => {
        void refreshLesson()
        void refreshCases()
    }, [refreshLesson, refreshCases])
    return {
        lesson,
        course,
        marks: casesRead.data,
        labPhase: labRead.data?.phase,
        isPassed: labRead.data?.latestSubmission?.passed === true,
        error: lessonRead.error ?? casesRead.error,
        isLoading:
            lessonRead.isLoading || (lesson !== undefined && casesRead.data === undefined && casesRead.isLoading),
        isValidating: lessonRead.isValidating || casesRead.isValidating,
        refresh,
    }
}
