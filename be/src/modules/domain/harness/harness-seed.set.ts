import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectPrimaryEntityManager } from "@modules/platform/database"
import { SeedRefusal, type SeedOutcome, type SeedSet, type StoreIdentity } from "@modules/integrations/seed"
import { HarnessImportService } from "./harness-import.service"
import { HARNESS_SEED_KINDS, harnessItemOf, harnessVersionOf } from "./harness-seed.policy"
import type { ContentRow } from "./persistence/harness.rows"
import { SELECT_PUBLISHED_KEYS, SELECT_PUBLISHED_ONE } from "./persistence/harness.sql"

/** One harness set of a seed standard, generic over its kind: the records are converted items, stored as immutable versions by content hash. */
abstract class HarnessSeedSet implements SeedSet {
    abstract readonly set: string

    constructor(
        protected readonly entityManager: EntityManager,
        protected readonly importer: HarnessImportService,
    ) {}

    /** What the record would do: create, add a version of a key already held, or nothing. */
    async plan(_key: string, value: unknown): Promise<SeedOutcome> {
        const item = this.itemOf(value)
        const live: Array<ContentRow> = await this.entityManager.query(SELECT_PUBLISHED_ONE, [item.kind, item.key])
        if (live[0] === undefined) return "created"
        return live[0].content_hash === item.hash ? "unchanged" : "updated"
    }

    /** Stores the record as the live version of its key and answers what it did. */
    async apply(key: string, value: unknown): Promise<SeedOutcome> {
        const outcome = await this.plan(key, value)
        if (outcome === "unchanged") return outcome
        const item = this.itemOf(value)
        const status = await this.importer.store(item, harnessVersionOf(item))
        if (status === "refused") throw new SeedRefusal("HARNESS_VERSION_IMMUTABLE")
        return outcome
    }

    /** The keys of the live items of the kind. */
    async keys(): Promise<ReadonlyArray<string>> {
        const rows: Array<{ content_key: string }> = await this.entityManager.query(SELECT_PUBLISHED_KEYS, [
            HARNESS_SEED_KINDS[this.set],
        ])
        return rows.map((row) => row.content_key)
    }

    /** The content key is the identity of the item. */
    async identityOf(key: string): Promise<StoreIdentity> {
        return (await this.keys()).includes(key) ? key : null
    }

    private itemOf(value: unknown): NonNullable<ReturnType<typeof harnessItemOf>> {
        const item = harnessItemOf(this.set, value)
        if (item === null) throw new SeedRefusal("HARNESS_RECORD_INVALID")
        return item
    }
}

@Injectable()
/** The `harness-builds` set: the build kits of /harness Build, keyed by build id. */
export class HarnessBuildsSeedSet extends HarnessSeedSet {
    readonly set = "harness-builds"
    constructor(@InjectPrimaryEntityManager() entityManager: EntityManager, importer: HarnessImportService) {
        super(entityManager, importer)
    }
}

@Injectable()
/** The `harness-guides` set: the Use guides of Claude Code and Codex, keyed by tool folder and slug. */
export class HarnessGuidesSeedSet extends HarnessSeedSet {
    readonly set = "harness-guides"
    constructor(@InjectPrimaryEntityManager() entityManager: EntityManager, importer: HarnessImportService) {
        super(entityManager, importer)
    }
}

@Injectable()
/** The `harness-docs` set: the documentation pages, keyed by slug. */
export class HarnessDocsSeedSet extends HarnessSeedSet {
    readonly set = "harness-docs"
    constructor(@InjectPrimaryEntityManager() entityManager: EntityManager, importer: HarnessImportService) {
        super(entityManager, importer)
    }
}

@Injectable()
/** The `harness-probes` set: the doctor probes, keyed by tool and probe id. */
export class HarnessProbesSeedSet extends HarnessSeedSet {
    readonly set = "harness-probes"
    constructor(@InjectPrimaryEntityManager() entityManager: EntityManager, importer: HarnessImportService) {
        super(entityManager, importer)
    }
}

@Injectable()
/** The `harness-doctor-packs` set: the doctor probe tarball of each tool, keyed by tool. */
export class HarnessDoctorPacksSeedSet extends HarnessSeedSet {
    readonly set = "harness-doctor-packs"
    constructor(@InjectPrimaryEntityManager() entityManager: EntityManager, importer: HarnessImportService) {
        super(entityManager, importer)
    }
}

@Injectable()
/** The `harness-traps` set: the trial traps, keyed by trap id. */
export class HarnessTrapsSeedSet extends HarnessSeedSet {
    readonly set = "harness-traps"
    constructor(@InjectPrimaryEntityManager() entityManager: EntityManager, importer: HarnessImportService) {
        super(entityManager, importer)
    }
}
