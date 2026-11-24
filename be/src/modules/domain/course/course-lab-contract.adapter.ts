import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager, type sql } from "@modules/platform/database"
import {
    labProjectOf,
    type RelayLabContract,
    type RelayLabContractPort,
    type RelayLabCut,
    type RelayLabFile,
    type RelayLabHiddenFile,
} from "@modules/domain/relay"
import { contractOf, cutFilesOf, hiddenFilesOf } from "./course-lab-contract.policy"
import {
    courseLabFileListOf,
    courseLabFilesMetaOf,
    type CourseLabFileEntry,
    type CourseLabFilesMeta,
} from "./course-lab-files-record.policy"
import { courseIdValid, type CourseLabRecord } from "./course-lab-record.policy"
import { courseRecordCheckOf } from "./course-record.policy"
import { CourseLabService } from "./course-lab.service"
import {
    SELECT_LAB_FILES_HIDDEN,
    SELECT_LAB_FILES_META,
    SELECT_LAB_FILES_NESTJS,
    SELECT_LAB_FILES_SOURCE,
    SELECT_PUBLISHED_COURSE,
} from "./persistence/course.sql"
import type { CourseCourseRow, CourseLabFilesMetaRow, CourseLabFilesSliceRow } from "./persistence/course.rows"

@Injectable()
/**
 * The relay's lab contract port, answered by the course capability (provided from `CourseModule` as `RELAY_LAB_CONTRACT`). The contract is
 * built from the live `essentials-labs` record and the live `essentials-lab-files` record of the lesson, and only for a lesson the live
 * course record names. The files of the lab never leave through any other door: no web type carries them (conventions rule 4).
 * `solution` has no cut in the standard (its `source` is the c0 checkout, not a solution), so it is empty.
 */
export class CourseLabContractAdapter implements RelayLabContractPort {
    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        private readonly labs: CourseLabService,
    ) {}

    /** The lab contract of a lesson of a course, or null when the course or its lesson has no live lab. */
    async contractOf(courseId: string, lessonId: string): Promise<RelayLabContract | null> {
        const record = await this.recordOf(courseId, lessonId)
        if (record === null) return null
        const meta = await this.metaOf(lessonId)
        if (meta === null) return null
        return contractOf(record, meta, labProjectOf(courseId, lessonId))
    }

    /** The files of one cut: the c0 checkout for `bugs`, the NestJS version for `framework:nestjs`, nothing for `solution`. */
    async labFilesOf(courseId: string, lessonId: string, cut: RelayLabCut): Promise<ReadonlyArray<RelayLabFile>> {
        if (cut === "solution" || (await this.recordOf(courseId, lessonId)) === null) return []
        const files = await this.sliceOf(cut === "bugs" ? SELECT_LAB_FILES_SOURCE : SELECT_LAB_FILES_NESTJS, lessonId)
        return cutFilesOf(files ?? [])
    }

    /** The hidden grading files, each already under the grader folder; never read for the web. */
    async hiddenOf(courseId: string, lessonId: string): Promise<ReadonlyArray<RelayLabHiddenFile>> {
        if ((await this.recordOf(courseId, lessonId)) === null) return []
        return hiddenFilesOf((await this.sliceOf(SELECT_LAB_FILES_HIDDEN, lessonId)) ?? [])
    }

    /** The ids of the hidden tests: the cells of the grader. */
    async hiddenTestIdsOf(courseId: string, lessonId: string): Promise<ReadonlyArray<string>> {
        return (await this.contractOf(courseId, lessonId))?.grading?.scenarios ?? []
    }

    /** The live lab record of the lesson when the live course record of `courseId` names the lesson; else null. */
    private async recordOf(courseId: string, lessonId: string): Promise<CourseLabRecord | null> {
        if (!courseIdValid(courseId) || !courseIdValid(lessonId)) return null
        const rows: Array<CourseCourseRow> = await this.entityManager.query(SELECT_PUBLISHED_COURSE, [courseId])
        const checked = rows[0] === undefined ? null : courseRecordCheckOf(courseId, rows[0].record)
        if (checked === null || !checked.ok || !checked.record.lessons.some((each) => each.id === lessonId)) return null
        return (await this.labs.live(lessonId))?.record ?? null
    }

    private async metaOf(lessonId: string): Promise<CourseLabFilesMeta | null> {
        const rows: Array<CourseLabFilesMetaRow> = await this.entityManager.query(SELECT_LAB_FILES_META, [lessonId])
        return rows[0] === undefined ? null : courseLabFilesMetaOf(rows[0].meta)
    }

    private async sliceOf(query: ReturnType<typeof sql>, lessonId: string): Promise<ReadonlyArray<CourseLabFileEntry> | null> {
        const rows: Array<CourseLabFilesSliceRow> = await this.entityManager.query(query, [lessonId])
        return rows[0] === undefined ? null : courseLabFileListOf(rows[0].files)
    }
}
