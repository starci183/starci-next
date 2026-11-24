import type { CourseLocale } from "@modules/domain/course"

/** The lesson whose lab the learner reads, and the language of its hint texts. */
export interface GetCourseLessonRequest {
    /** The lesson id, a lowercase slug. */
    readonly lessonId: string
    /** The locale of the hint texts. */
    readonly locale: CourseLocale
}

/** The lesson whose cases the learner reads. */
export interface GetCourseCasesRequest {
    /** The lesson id, a lowercase slug. */
    readonly lessonId: string
}

/** The hint level the learner opens on one case. */
export interface OpenCourseHintRequest extends GetCourseLessonRequest {
    /** The case id, a lowercase slug. */
    readonly caseId: string
    /** The level, 1 to 3. */
    readonly level: number
}

/** The course whose catalog entry the learner reads. */
export interface GetCourseRequest {
    /** The course id, a lowercase slug. */
    readonly courseId: string
}
