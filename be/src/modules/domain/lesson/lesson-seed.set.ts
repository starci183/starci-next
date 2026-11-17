import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { z } from "zod"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { SeedRefusal, type SeedOutcome, type SeedSet, type StoreIdentity } from "@modules/integrations/seed"
import { LESSON_LOCALES, type LessonContent } from "./lesson.contracts"
import {
    INSERT_VERSION,
    PUBLISH_VERSION,
    SELECT_PUBLISHED_IDS,
    SELECT_PUBLISHED_PLACEMENT,
    SELECT_VERSION_HASH,
    SUPERSEDE_PUBLISHED,
    UPDATE_PLACEMENT,
} from "./persistence/lesson.sql"
import type { HashRow, InsertedRow } from "./persistence/lesson.rows"

/** The characters of the content hash a version label keeps: a standard names a lesson by its id and a version by what it holds. */
const LABEL_LENGTH = 12

const localeDocument = z.looseObject({ title: z.string(), description: z.string() })

/** The record a seed standard carries for one lesson: the draft the importer builds, without the topic page copy. */
const lessonRecord = z.looseObject({
    id: z.string().min(1),
    category: z.string().min(1),
    group: z.string().min(1),
    topic: z.string().min(1),
    difficulty: z.enum(["foundation", "intermediate", "advanced"]),
    implementation: z.string().min(1),
    minutesRead: z.number().int().min(0),
    sortIndex: z.number().int(),
    sourceKey: z.string().nullable(),
    contentHash: z.string().min(LABEL_LENGTH),
    sourceHashes: z.record(z.string(), z.string()),
    content: z.looseObject({ locales: z.looseObject({ vi: localeDocument, en: localeDocument }) }),
})

type LessonRecord = z.infer<typeof lessonRecord>

/** The columns of the live version a standard may move without new content. */
interface PlacementRow extends HashRow {
    version: string
    lesson_group: string
    topic: string
    sort_index: number
}

const byLocale = (content: LessonContent, pick: "title" | "description"): string =>
    JSON.stringify(Object.fromEntries(LESSON_LOCALES.map((locale) => [locale, content.locales[locale][pick]])))

const recordOf = (key: string, value: unknown): LessonRecord => {
    const parsed = lessonRecord.safeParse(value)
    if (!parsed.success) throw new SeedRefusal("LESSON_RECORD_INVALID")
    if (parsed.data.id !== key) throw new SeedRefusal("LESSON_KEY_MISMATCH")
    return parsed.data
}

@Injectable()
/**
 * The `lessons` set of a seed standard (PROJECT-STACKS-13): one record per lesson, keyed by the lesson id. A lesson whose content
 * hash the live version already carries only has its placement (group, topic, order, source folder) brought in line; any other
 * content becomes a new immutable version that supersedes the live one, so every earlier version a learner studied stays readable.
 */
export class LessonSeedSet implements SeedSet {
    readonly set = "lessons"

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** What the lesson record would do: create, move the placement or add a version, or nothing. */
    async plan(key: string, value: unknown): Promise<SeedOutcome> {
        const record = recordOf(key, value)
        const live = await this.liveOf(record.id)
        if (live === undefined) {
            const held = await this.versionOf(record)
            return held === undefined ? "created" : "updated"
        }
        if (live.content_hash !== record.contentHash) return "updated"
        return this.moved(live, record) ? "updated" : "unchanged"
    }

    /** Upserts the lesson by its id and answers what it did. */
    async apply(key: string, value: unknown): Promise<SeedOutcome> {
        const record = recordOf(key, value)
        const outcome = await this.plan(key, value)
        if (outcome === "unchanged") return outcome
        const live = await this.liveOf(record.id)
        const version = record.contentHash.slice(0, LABEL_LENGTH)
        if (live?.content_hash === record.contentHash) {
            await this.entityManager.query(UPDATE_PLACEMENT, [
                record.id,
                live.version,
                record.group,
                record.topic,
                record.sortIndex,
                record.sourceKey,
            ])
            return outcome
        }
        const held = await this.versionOf(record)
        if (held !== undefined && held.content_hash !== record.contentHash) {
            throw new SeedRefusal("LESSON_VERSION_IMMUTABLE")
        }
        await this.entityManager.transaction(async (manager) => {
            await manager.query(SUPERSEDE_PUBLISHED, [record.id])
            if (held !== undefined) {
                await manager.query(PUBLISH_VERSION, [record.id, version])
                return
            }
            const inserted: Array<InsertedRow> = await manager.query(
                INSERT_VERSION,
                this.versionParams(record, version),
            )
            if (inserted.length === 0) throw new SeedRefusal("LESSON_VERSION_IMMUTABLE")
        })
        return outcome
    }

    /** The ids of the lessons that have a live version. */
    async keys(): Promise<ReadonlyArray<string>> {
        const rows: Array<{ lesson_id: string }> = await this.entityManager.query(SELECT_PUBLISHED_IDS)
        return rows.map((row) => row.lesson_id)
    }

    /** The lesson id is the identity: every version of a lesson, and every reference to it, hangs on it. */
    async identityOf(key: string): Promise<StoreIdentity> {
        return (await this.liveOf(key)) === undefined ? null : key
    }

    private async liveOf(id: string): Promise<PlacementRow | undefined> {
        const rows: Array<PlacementRow> = await this.entityManager.query(SELECT_PUBLISHED_PLACEMENT, [id])
        return rows[0]
    }

    private async versionOf(record: LessonRecord): Promise<HashRow | undefined> {
        const rows: Array<HashRow> = await this.entityManager.query(SELECT_VERSION_HASH, [
            record.id,
            record.contentHash.slice(0, LABEL_LENGTH),
        ])
        return rows[0]
    }

    private moved(live: PlacementRow, record: LessonRecord): boolean {
        return (
            live.lesson_group !== record.group ||
            live.topic !== record.topic ||
            live.sort_index !== record.sortIndex ||
            live.source_key !== record.sourceKey
        )
    }

    private versionParams(record: LessonRecord, version: string): Array<unknown> {
        const content = record.content as unknown as LessonContent
        return [
            record.id,
            version,
            record.contentHash,
            record.category,
            record.difficulty,
            record.minutesRead,
            record.implementation,
            record.sortIndex,
            byLocale(content, "title"),
            byLocale(content, "description"),
            JSON.stringify(record.sourceHashes),
            JSON.stringify(record.content),
            this.clock.now(),
            record.group,
            record.topic,
            record.sourceKey,
        ]
    }
}
