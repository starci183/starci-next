import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { CourseError, CourseErrorCode } from "./errors/course.error"
import type { CourseCatalogDetailView, CourseCatalogEntryView, CourseLabTerms } from "./course-catalog.contracts"
import { catalogDetailOf, catalogEntryOf, catalogOrderCompare, labTermsOf } from "./course-catalog.policy"
import { courseIdValid } from "./course-lab-record.policy"
import { courseRecordCheckOf, type CourseRecord } from "./course-record.policy"
import { SELECT_LAB_TERMS, SELECT_PUBLISHED_COURSE, SELECT_PUBLISHED_COURSES } from "./persistence/course.sql"
import type { CourseCourseRow, CourseLabTermsRow } from "./persistence/course.rows"

@Injectable()
/** Reads the course records the seed standard carried in and lists them for any signed-in learner: the catalog is free, only the labs are Premium. */
export class CourseCatalogService {
    constructor(@InjectPrimaryEntityManager() private readonly entityManager: EntityManager) {}

    /**
     * Every live course with its lessons, in the concept graph's teaching order (the record's `order`; a course without one comes last), each
     * lesson marked available when a lab record of it is live. A stored record that no longer reads is left out.
     */
    async courses(): Promise<ReadonlyArray<CourseCatalogEntryView>> {
        const rows: Array<CourseCourseRow> = await this.entityManager.query(SELECT_PUBLISHED_COURSES)
        const records = rows.flatMap((row) => {
            const checked = courseRecordCheckOf(row.course_id, row.record)
            return checked.ok ? [checked.record] : []
        })
        const labs = await this.labsOf(records)
        return records.map((record) => catalogEntryOf(record, labs)).sort(catalogOrderCompare)
    }

    /** One live course with the system map of its intro; COURSE_NOT_FOUND for an id that is no slug or has no live record. */
    async course(courseId: string): Promise<CourseCatalogDetailView> {
        if (!courseIdValid(courseId)) throw new CourseError({ code: CourseErrorCode.NotFound })
        const rows: Array<CourseCourseRow> = await this.entityManager.query(SELECT_PUBLISHED_COURSE, [courseId])
        const checked = rows[0] === undefined ? null : courseRecordCheckOf(courseId, rows[0].record)
        if (checked === null || !checked.ok) throw new CourseError({ code: CourseErrorCode.NotFound })
        return catalogDetailOf(checked.record, await this.labsOf([checked.record]))
    }

    /** The terms of the live lab of every lesson the records name; a lesson with no row has no live lab. */
    private async labsOf(records: ReadonlyArray<CourseRecord>): Promise<ReadonlyMap<string, CourseLabTerms>> {
        const lessonIds = records.flatMap((record) => record.lessons.map((each) => each.id))
        if (lessonIds.length === 0) return new Map()
        const rows: Array<CourseLabTermsRow> = await this.entityManager.query(SELECT_LAB_TERMS, [lessonIds])
        return new Map(rows.map((row) => [row.lesson_id, labTermsOf(row.allowed_terms)]))
    }
}
