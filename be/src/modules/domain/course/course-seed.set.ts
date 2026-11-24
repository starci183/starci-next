import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { SeedRefusal, type SeedOutcome, type SeedSet, type StoreIdentity } from "@modules/integrations/seed"
import {
    courseRecordCheckOf,
    courseRecordHashOf,
    courseRecordVersionOf,
    type CourseRecord,
} from "./course-record.policy"
import {
    INSERT_COURSE_VERSION,
    PUBLISH_COURSE_VERSION,
    SELECT_COURSE_VERSION,
    SELECT_PUBLISHED_COURSE,
    SELECT_PUBLISHED_COURSE_IDS,
    SUPERSEDE_PUBLISHED_COURSE,
} from "./persistence/course.sql"
import type { CourseCourseHashRow } from "./persistence/course.rows"

/** A record the standard carries, judged: the record, its hash and its version label. */
interface JudgedCourse {
    readonly record: CourseRecord
    readonly hash: string
    readonly version: string
}

const judge = (key: string, value: unknown): JudgedCourse => {
    const checked = courseRecordCheckOf(key, value)
    if (!checked.ok) throw new SeedRefusal(checked.refusal)
    const hash = courseRecordHashOf(checked.record)
    return { record: checked.record, hash, version: courseRecordVersionOf(hash) }
}

@Injectable()
/**
 * The `essentials-courses` set of a seed standard (PROJECT-STACKS-13): one course record per course, keyed by the course id. A record whose
 * content hash the live version already carries changes nothing; any other content becomes a new immutable version that supersedes the
 * live one. A version label seen again with other bytes is refused.
 */
export class CourseSeedSet implements SeedSet {
    readonly set = "essentials-courses"

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** What the record would do: create the course, add a version, or nothing. */
    async plan(key: string, value: unknown): Promise<SeedOutcome> {
        const judged = judge(key, value)
        const live = await this.liveOf(judged.record.id)
        if (live === undefined) return (await this.versionOf(judged)) === undefined ? "created" : "updated"
        return live.content_hash === judged.hash ? "unchanged" : "updated"
    }

    /** Upserts the course by its id and answers what it did. */
    async apply(key: string, value: unknown): Promise<SeedOutcome> {
        const judged = judge(key, value)
        const outcome = await this.plan(key, value)
        if (outcome === "unchanged") return outcome
        const held = await this.versionOf(judged)
        if (held !== undefined && held.content_hash !== judged.hash) throw new SeedRefusal("COURSE_VERSION_IMMUTABLE")
        const courseId = judged.record.id
        await this.entityManager.transaction(async (manager) => {
            await manager.query(SUPERSEDE_PUBLISHED_COURSE, [courseId])
            if (held !== undefined) {
                await manager.query(PUBLISH_COURSE_VERSION, [courseId, judged.version])
                return
            }
            const inserted: Array<{ course_id: string }> = await manager.query(INSERT_COURSE_VERSION, [
                courseId,
                judged.version,
                judged.hash,
                JSON.stringify(judged.record),
                this.clock.now(),
            ])
            if (inserted.length === 0) throw new SeedRefusal("COURSE_VERSION_IMMUTABLE")
        })
        return outcome
    }

    /** The ids of the courses that have a live record. */
    async keys(): Promise<ReadonlyArray<string>> {
        const rows: Array<{ course_id: string }> = await this.entityManager.query(SELECT_PUBLISHED_COURSE_IDS)
        return rows.map((row) => row.course_id)
    }

    /** The course id is the identity: every version of a course hangs on it. */
    async identityOf(key: string): Promise<StoreIdentity> {
        return (await this.liveOf(key)) === undefined ? null : key
    }

    private async liveOf(courseId: string): Promise<CourseCourseHashRow | undefined> {
        const rows: Array<CourseCourseHashRow> = await this.entityManager.query(SELECT_PUBLISHED_COURSE, [courseId])
        return rows[0]
    }

    private async versionOf(judged: JudgedCourse): Promise<CourseCourseHashRow | undefined> {
        const rows: Array<CourseCourseHashRow> = await this.entityManager.query(SELECT_COURSE_VERSION, [
            judged.record.id,
            judged.version,
        ])
        return rows[0]
    }
}
