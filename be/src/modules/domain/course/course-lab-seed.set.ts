import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { SeedRefusal, type SeedOutcome, type SeedSet, type StoreIdentity } from "@modules/integrations/seed"
import {
    courseLabCheckOf,
    courseLabHashOf,
    courseLabVersionOf,
    type CourseLabRecord,
} from "./course-lab-record.policy"
import {
    INSERT_LAB_VERSION,
    PUBLISH_LAB_VERSION,
    SELECT_LAB_VERSION,
    SELECT_PUBLISHED_LAB,
    SELECT_PUBLISHED_LAB_IDS,
    SUPERSEDE_PUBLISHED_LAB,
} from "./persistence/course.sql"
import type { CourseLabHashRow } from "./persistence/course.rows"

/** A record the standard carries, judged: the record, its hash and its version label. */
interface JudgedRecord {
    readonly record: CourseLabRecord
    readonly hash: string
    readonly version: string
}

const judge = (key: string, value: unknown): JudgedRecord => {
    const checked = courseLabCheckOf(key, value)
    if (!checked.ok) throw new SeedRefusal(checked.refusal)
    const hash = courseLabHashOf(checked.record)
    return { record: checked.record, hash, version: courseLabVersionOf(hash) }
}

@Injectable()
/**
 * The `essentials-labs` set of a seed standard (PROJECT-STACKS-13): one lab@2 record per lesson, keyed by the lesson id. A record whose
 * content hash the live version already carries changes nothing; any other content becomes a new immutable version that supersedes the
 * live one, so a version a learner worked against stays readable. A version label seen again with other bytes is refused.
 */
export class CourseLabSeedSet implements SeedSet {
    readonly set = "essentials-labs"

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** What the record would do: create the lab, add a version, or nothing. */
    async plan(key: string, value: unknown): Promise<SeedOutcome> {
        const judged = judge(key, value)
        const live = await this.liveOf(judged.record.lessonId)
        if (live === undefined) return (await this.versionOf(judged)) === undefined ? "created" : "updated"
        return live.content_hash === judged.hash ? "unchanged" : "updated"
    }

    /** Upserts the lab by its lesson id and answers what it did. */
    async apply(key: string, value: unknown): Promise<SeedOutcome> {
        const judged = judge(key, value)
        const outcome = await this.plan(key, value)
        if (outcome === "unchanged") return outcome
        const held = await this.versionOf(judged)
        if (held !== undefined && held.content_hash !== judged.hash) throw new SeedRefusal("COURSE_LAB_VERSION_IMMUTABLE")
        const lessonId = judged.record.lessonId
        await this.entityManager.transaction(async (manager) => {
            await manager.query(SUPERSEDE_PUBLISHED_LAB, [lessonId])
            if (held !== undefined) {
                await manager.query(PUBLISH_LAB_VERSION, [lessonId, judged.version])
                return
            }
            const inserted: Array<{ lesson_id: string }> = await manager.query(INSERT_LAB_VERSION, [
                lessonId,
                judged.version,
                judged.hash,
                JSON.stringify(judged.record),
                this.clock.now(),
            ])
            if (inserted.length === 0) throw new SeedRefusal("COURSE_LAB_VERSION_IMMUTABLE")
        })
        return outcome
    }

    /** The ids of the lessons that have a live lab. */
    async keys(): Promise<ReadonlyArray<string>> {
        const rows: Array<{ lesson_id: string }> = await this.entityManager.query(SELECT_PUBLISHED_LAB_IDS)
        return rows.map((row) => row.lesson_id)
    }

    /** The lesson id is the identity: every version of a lab, and every run against it, hangs on it. */
    async identityOf(key: string): Promise<StoreIdentity> {
        return (await this.liveOf(key)) === undefined ? null : key
    }

    private async liveOf(lessonId: string): Promise<CourseLabHashRow | undefined> {
        const rows: Array<CourseLabHashRow> = await this.entityManager.query(SELECT_PUBLISHED_LAB, [lessonId])
        return rows[0]
    }

    private async versionOf(judged: JudgedRecord): Promise<CourseLabHashRow | undefined> {
        const rows: Array<CourseLabHashRow> = await this.entityManager.query(SELECT_LAB_VERSION, [
            judged.record.lessonId,
            judged.version,
        ])
        return rows[0]
    }
}
