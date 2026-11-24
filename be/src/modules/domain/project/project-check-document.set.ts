import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { z } from "zod"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { SeedRefusal, type SeedOutcome, type SeedSet, type StoreIdentity } from "@modules/integrations/seed"
import {
    SELECT_CHECK_DOCUMENT_EQUAL,
    SELECT_CHECK_DOCUMENT_KEYS,
    UPSERT_CHECK_DOCUMENT,
} from "./persistence/project.sql"

/** The sets of the check set a seed standard carries, as the standard names them. */
export const CHECK_DOCUMENT_SETS = {
    catalog: "project-catalog",
    probes: "project-probes",
    kit: "project-kit",
} as const

const SHA256_LENGTH = 64

const catalogRecord = z.looseObject({ data: z.record(z.string(), z.unknown()), text: z.string().min(1) })
const probeRecord = z.looseObject({
    id: z.string().min(1),
    data: z.record(z.string(), z.unknown()),
    text: z.string().min(1),
})
const kitRecord = z.looseObject({ path: z.string().min(1), text: z.string(), sha256: z.string().length(SHA256_LENGTH) })

/** One document of the check set held in the database, keyed by set and natural key; a record is stored verbatim. */
abstract class ProjectCheckDocumentSet implements SeedSet {
    abstract readonly set: string

    constructor(
        protected readonly entityManager: EntityManager,
        protected readonly clock: Clock,
    ) {}

    /** Answers the record when it is valid for its set and the key it carries; throws a refusal otherwise. */
    protected abstract judge(key: string, value: unknown): Record<string, unknown>

    /** What the record would do: create, update or nothing. */
    async plan(key: string, value: unknown): Promise<SeedOutcome> {
        const record = this.judge(key, value)
        const rows: Array<{ equal: boolean }> = await this.entityManager.query(SELECT_CHECK_DOCUMENT_EQUAL, [
            this.set,
            key,
            JSON.stringify(record),
        ])
        const held = rows[0]
        if (held === undefined) return "created"
        return held.equal ? "unchanged" : "updated"
    }

    /** Upserts the document by its natural key and answers what it did. */
    async apply(key: string, value: unknown): Promise<SeedOutcome> {
        const outcome = await this.plan(key, value)
        if (outcome === "unchanged") return outcome
        await this.entityManager.query(UPSERT_CHECK_DOCUMENT, [
            this.set,
            key,
            JSON.stringify(this.judge(key, value)),
            this.clock.now(),
        ])
        return outcome
    }

    /** The keys the set holds. */
    async keys(): Promise<ReadonlyArray<string>> {
        const rows: Array<{ document_key: string }> = await this.entityManager.query(SELECT_CHECK_DOCUMENT_KEYS, [
            this.set,
        ])
        return rows.map((row) => row.document_key)
    }

    /** The natural key is the identity of the document. */
    async identityOf(key: string): Promise<StoreIdentity> {
        return (await this.keys()).includes(key) ? key : null
    }
}

const recordOf = (shape: z.ZodType<Record<string, unknown>>, value: unknown, code: string): Record<string, unknown> => {
    const parsed = shape.safeParse(value)
    if (!parsed.success) throw new SeedRefusal(code)
    return parsed.data
}

@Injectable()
/** The `project-catalog` set: one record, `catalog`, holding the parsed catalog and its text. */
export class ProjectCatalogSeedSet extends ProjectCheckDocumentSet {
    readonly set: "project-catalog" = CHECK_DOCUMENT_SETS.catalog

    constructor(@InjectPrimaryEntityManager() entityManager: EntityManager, @InjectClock() clock: Clock) {
        super(entityManager, clock)
    }

    protected judge(key: string, value: unknown): Record<string, unknown> {
        if (key !== "catalog") throw new SeedRefusal("PROJECT_CATALOG_KEY")
        return recordOf(catalogRecord, value, "PROJECT_CATALOG_INVALID")
    }
}

@Injectable()
/** The `project-probes` set: one record per shared probe, keyed by the probe id. */
export class ProjectProbesSeedSet extends ProjectCheckDocumentSet {
    readonly set: "project-probes" = CHECK_DOCUMENT_SETS.probes

    constructor(@InjectPrimaryEntityManager() entityManager: EntityManager, @InjectClock() clock: Clock) {
        super(entityManager, clock)
    }

    protected judge(key: string, value: unknown): Record<string, unknown> {
        const parsed = recordOf(probeRecord, value, "PROJECT_PROBE_INVALID")
        if (parsed["id"] !== key) throw new SeedRefusal("PROJECT_PROBE_KEY_MISMATCH")
        return parsed
    }
}

@Injectable()
/** The `project-kit` set: one record per file of the folder `starci-relay init` copies into a learner project, keyed by its path. */
export class ProjectKitSeedSet extends ProjectCheckDocumentSet {
    readonly set: "project-kit" = CHECK_DOCUMENT_SETS.kit

    constructor(@InjectPrimaryEntityManager() entityManager: EntityManager, @InjectClock() clock: Clock) {
        super(entityManager, clock)
    }

    protected judge(key: string, value: unknown): Record<string, unknown> {
        const parsed = recordOf(kitRecord, value, "PROJECT_KIT_INVALID")
        if (parsed["path"] !== key) throw new SeedRefusal("PROJECT_KIT_KEY_MISMATCH")
        return parsed
    }
}
