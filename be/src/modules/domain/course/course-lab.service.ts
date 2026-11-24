import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectEntitlementService, type EntitlementService } from "@modules/domain/entitlement"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { CourseError, CourseErrorCode } from "./errors/course.error"
import { caseMarksOf } from "./course-case.reader"
import { lessonViewOf } from "./course-case.policy"
import type { CourseLessonView, CourseLocale } from "./course-lab.contracts"
import { courseIdValid, courseLabCheckOf, type CourseLabRecord } from "./course-lab-record.policy"
import { SELECT_PUBLISHED_LAB } from "./persistence/course.sql"
import type { CourseLabRow } from "./persistence/course.rows"

/** The Essentials part the lab belongs to: hands-on work beyond the free part, so it needs what that part needs (Premium by default). */
export const COURSE_ESSENTIAL_PART = "4-apply"

/** The live lab of a lesson: its version label and its validated record. */
export interface CourseLabLive {
    /** The version label. */
    readonly version: string
    /** The record. */
    readonly record: CourseLabRecord
}

@Injectable()
/** Reads the lab@2 records the seed standard carried in and projects them for the web, hint by hint, for the signed-in learner. */
export class CourseLabService {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectEntitlementService() private readonly entitlement: EntitlementService,
    ) {}

    /** The live lab of a lesson, or null when the lesson has none. */
    async live(lessonId: string): Promise<CourseLabLive | null> {
        if (!courseIdValid(lessonId)) return null
        const rows: Array<CourseLabRow> = await this.entityManager.query(SELECT_PUBLISHED_LAB, [lessonId])
        const row = rows[0]
        if (row === undefined) return null
        const checked = courseLabCheckOf(lessonId, row.record)
        return checked.ok ? { version: row.version, record: checked.record } : null
    }

    /** The live lab for a learner who may read it: a slug id, then Premium by the one entitlement question, then the record. */
    async readable(learnerId: string, lessonId: string): Promise<CourseLabLive> {
        if (!courseIdValid(lessonId)) throw new CourseError({ code: CourseErrorCode.LessonNotFound })
        if (!(await this.entitlement.mayReadEssentialPart(learnerId, COURSE_ESSENTIAL_PART)))
            throw new CourseError({ code: CourseErrorCode.PremiumRequired })
        const lab = await this.live(lessonId)
        if (lab === null) throw new CourseError({ code: CourseErrorCode.LessonNotFound })
        return lab
    }

    /** The lab as the web may see it, with the hint texts of the levels this learner opened and no others. */
    async lessonView(learnerId: string, lessonId: string, locale: CourseLocale): Promise<CourseLessonView> {
        const lab = await this.readable(learnerId, lessonId)
        const marks = await caseMarksOf(this.entityManager, learnerId, lessonId)
        return lessonViewOf(lab.record, lab.version, marks, locale)
    }
}
