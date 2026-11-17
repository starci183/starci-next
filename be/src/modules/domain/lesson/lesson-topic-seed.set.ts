import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { z } from "zod"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { SeedRefusal, type SeedOutcome, type SeedSet, type StoreIdentity } from "@modules/integrations/seed"
import { SELECT_TOPIC, SELECT_TOPIC_SLUGS, UPSERT_TOPIC_KEEPING_PATH } from "./persistence/lesson.sql"
import type { TopicRow } from "./persistence/lesson.rows"

/** The ref a topic row of a standard carries: the path rows of a V1 course module keep the ref they were read at. */
const STANDARD_REF = "seed-standard"

/** The record a seed standard carries for one topic: its title, origin and page copy. */
const topicRecord = z.looseObject({
    topic: z.string().min(1),
    title: z.string().min(1),
    from: z.string(),
    modules: z.array(z.unknown()),
    details: z
        .looseObject({
            description: z.string(),
            prerequisites: z.array(z.string()),
            related: z.array(z.string()),
        })
        .optional(),
})

type TopicRecord = z.infer<typeof topicRecord>

const recordOf = (key: string, value: unknown): TopicRecord => {
    const parsed = topicRecord.safeParse(value)
    if (!parsed.success) throw new SeedRefusal("TOPIC_RECORD_INVALID")
    if (parsed.data.topic !== key) throw new SeedRefusal("TOPIC_KEY_MISMATCH")
    // The path rows come from the source modules of the V1 courses, which a standard cannot carry: a topic that names modules is the import's.
    if (parsed.data.modules.length > 0) throw new SeedRefusal("TOPIC_MODULES_NOT_CARRIED")
    return parsed.data
}

const same = (left: unknown, right: unknown): boolean => JSON.stringify(left ?? null) === JSON.stringify(right ?? null)

@Injectable()
/**
 * The `lesson-topics` set of a seed standard: one record per topic, keyed by the topic slug. A topic row is upserted in place;
 * the path rows an import of a V1 course module wrote are not carried by a standard and are never overwritten.
 */
export class LessonTopicSeedSet implements SeedSet {
    readonly set = "lesson-topics"

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** What the topic record would do: create, update, or nothing. */
    async plan(key: string, value: unknown): Promise<SeedOutcome> {
        const record = recordOf(key, value)
        const rows: Array<TopicRow> = await this.entityManager.query(SELECT_TOPIC, [record.topic])
        const held = rows[0]
        if (held === undefined) return "created"
        const equal =
            held.title === record.title &&
            held.source_note === record.from &&
            same(held.description, record.details?.description) &&
            same(held.prerequisites, record.details?.prerequisites) &&
            same(held.related, record.details?.related)
        return equal ? "unchanged" : "updated"
    }

    /** Upserts the topic by its slug and answers what it did. */
    async apply(key: string, value: unknown): Promise<SeedOutcome> {
        const record = recordOf(key, value)
        const outcome = await this.plan(key, value)
        if (outcome === "unchanged") return outcome
        await this.entityManager.query(UPSERT_TOPIC_KEEPING_PATH, [
            record.topic,
            record.title,
            record.from,
            record.details?.description ?? null,
            JSON.stringify(record.details?.prerequisites ?? null),
            JSON.stringify(record.details?.related ?? null),
            STANDARD_REF,
            this.clock.now(),
        ])
        return outcome
    }

    /** The slugs of the stored topics. */
    async keys(): Promise<ReadonlyArray<string>> {
        const rows: Array<{ topic: string }> = await this.entityManager.query(SELECT_TOPIC_SLUGS)
        return rows.map((row) => row.topic)
    }

    /** The topic slug is the identity of its row. */
    async identityOf(key: string): Promise<StoreIdentity> {
        const rows: Array<TopicRow> = await this.entityManager.query(SELECT_TOPIC, [key])
        return rows[0] === undefined ? null : key
    }
}
