import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { SeedRefusal, type SeedOutcome, type SeedSet, type StoreIdentity } from "@modules/integrations/seed"
import {
    courseLabFilesCheckOf,
    courseLabFilesHashOf,
    type CourseLabFilesRecord,
} from "./course-lab-files-record.policy"
import { courseLabVersionOf } from "./course-lab-record.policy"
import {
    INSERT_LAB_FILES_VERSION,
    PUBLISH_LAB_FILES_VERSION,
    SELECT_LAB_FILES_VERSION,
    SELECT_PUBLISHED_LAB_FILES,
    SELECT_PUBLISHED_LAB_FILES_IDS,
    SUPERSEDE_PUBLISHED_LAB_FILES,
} from "./persistence/course.sql"
import type { CourseLabHashRow } from "./persistence/course.rows"

/** A record the standard carries, judged: the record, its hash and its version label. */
interface JudgedFiles {
    readonly record: CourseLabFilesRecord
    readonly hash: string
    readonly version: string
}

const judge = (key: string, value: unknown): JudgedFiles => {
    const checked = courseLabFilesCheckOf(key, value)
    if (!checked.ok) throw new SeedRefusal(checked.refusal)
    const hash = courseLabFilesHashOf(checked.record)
    return { record: checked.record, hash, version: courseLabVersionOf(hash) }
}

@Injectable()
/**
 * The `essentials-lab-files` set of a seed standard (PROJECT-STACKS-13): one record per lesson, keyed by the lesson id, holding the
 * files of the lab (the c0 checkout, the NestJS version, the hidden grader). SERVER-ONLY: only the relay's contract port reads it,
 * never a web door (conventions rule 4). Versioned like `essentials-labs`: a record whose content hash the live version already
 * carries changes nothing, any other content becomes a new immutable version that supersedes the live one, and a version label seen
 * again with other bytes is refused.
 */
export class CourseLabFilesSeedSet implements SeedSet {
    readonly set = "essentials-lab-files"

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** What the record would do: create the files, add a version, or nothing. */
    async plan(key: string, value: unknown): Promise<SeedOutcome> {
        const judged = judge(key, value)
        const live = await this.liveOf(judged.record.lessonId)
        if (live === undefined) return (await this.versionOf(judged)) === undefined ? "created" : "updated"
        return live.content_hash === judged.hash ? "unchanged" : "updated"
    }

    /** Upserts the files by their lesson id and answers what it did. */
    async apply(key: string, value: unknown): Promise<SeedOutcome> {
        const judged = judge(key, value)
        const outcome = await this.plan(key, value)
        if (outcome === "unchanged") return outcome
        const held = await this.versionOf(judged)
        if (held !== undefined && held.content_hash !== judged.hash)
            throw new SeedRefusal("COURSE_LAB_FILES_VERSION_IMMUTABLE")
        const lessonId = judged.record.lessonId
        await this.entityManager.transaction(async (manager) => {
            await manager.query(SUPERSEDE_PUBLISHED_LAB_FILES, [lessonId])
            if (held !== undefined) {
                await manager.query(PUBLISH_LAB_FILES_VERSION, [lessonId, judged.version])
                return
            }
            const inserted: Array<{ lesson_id: string }> = await manager.query(INSERT_LAB_FILES_VERSION, [
                lessonId,
                judged.version,
                judged.hash,
                JSON.stringify(judged.record),
                this.clock.now(),
            ])
            if (inserted.length === 0) throw new SeedRefusal("COURSE_LAB_FILES_VERSION_IMMUTABLE")
        })
        return outcome
    }

    /** The ids of the lessons that have live lab files. */
    async keys(): Promise<ReadonlyArray<string>> {
        const rows: Array<{ lesson_id: string }> = await this.entityManager.query(SELECT_PUBLISHED_LAB_FILES_IDS)
        return rows.map((row) => row.lesson_id)
    }

    /** The lesson id is the identity: every version of the files hangs on it. */
    async identityOf(key: string): Promise<StoreIdentity> {
        return (await this.liveOf(key)) === undefined ? null : key
    }

    private async liveOf(lessonId: string): Promise<CourseLabHashRow | undefined> {
        const rows: Array<CourseLabHashRow> = await this.entityManager.query(SELECT_PUBLISHED_LAB_FILES, [lessonId])
        return rows[0]
    }

    private async versionOf(judged: JudgedFiles): Promise<CourseLabHashRow | undefined> {
        const rows: Array<CourseLabHashRow> = await this.entityManager.query(SELECT_LAB_FILES_VERSION, [
            judged.record.lessonId,
            judged.version,
        ])
        return rows[0]
    }
}
