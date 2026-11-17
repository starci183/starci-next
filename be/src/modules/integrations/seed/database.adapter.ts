import { Injectable } from "@nestjs/common"
import { recordValue } from "@starci/seed"
import type {
    DataEntry,
    ImportOptions,
    ImportReport,
    RefusedKey,
    SetImport,
    StoreAdapter,
    StoreDescription,
} from "@starci/seed"
import type { SeedSet, StoreIdentity } from "./seed.contracts"
import { InjectDatabaseSeedSets } from "./seed.decorators"
import { SeedRefusal } from "./seed.errors"

/** An export of no entry: its iterator is done at once. */
const NO_ENTRIES: AsyncIterable<DataEntry> = {
    [Symbol.asyncIterator]: () => ({ next: () => Promise.resolve({ done: true, value: undefined }) }),
}

/** The format the seed standard of the product renders (`<repository name>@<major>`), the prefix of every set schema. */
export const STANDARD_FORMAT = "starci-next-seed-standard"

/**
 * The sets of a standard whose feature the app retired. The loader reads them out of the copy, the door acknowledges them as
 * already equal and writes nothing, and `describe` says so.
 */
export const RETIRED_SETS: ReadonlyArray<string> = ["interview-overlay", "interview-overlay-index"]

const RETIRED_REASON = "the mock interview feature was removed; the door reads these entries and writes nothing"

const byName = (left: string, right: string): number => (left < right ? -1 : left > right ? 1 : 0)

/** The counts of one set while the entries stream in. */
interface Tally {
    created: number
    updated: number
    unchanged: number
    refused: Array<RefusedKey>
    seen: Set<string>
}

const emptyTally = (): Tally => ({ created: 0, updated: 0, unchanged: 0, refused: [], seen: new Set() })

@Injectable()
/**
 * The relational database as a store of the data standard (PROJECT-STACKS-14): the seed door of `seed-standard` sets
 * (PROJECT-STACKS-13, "The loader"). It holds the sets the domain capabilities compose into it, each an upsert by natural key
 * through that capability's own tables; it never removes (a mirror only counts what the standard no longer names) and never
 * overwrites what the standard does not carry. A set the standard carries and no capability holds is a refused key
 * (`SEED_SET_NOT_HELD`), so a new kind of content cannot arrive silently unread.
 */
export class DatabaseStore implements StoreAdapter {
    readonly id = "database"
    readonly kind = "database"
    readonly level = "logical"

    constructor(@InjectDatabaseSeedSets() private readonly sets: ReadonlyArray<SeedSet>) {}

    /** Lists the sets the store holds and what it does not do. */
    describe(): Promise<StoreDescription> {
        const named = [...this.sets.map((set) => set.set), ...RETIRED_SETS]
        return Promise.resolve({
            sets: named
                .sort(byName)
                .map((set) => ({ set, schema: `${STANDARD_FORMAT}/${set}@1`, form: "record" as const })),
            purposes: ["seed-standard"],
            canExport: false,
            canImport: true,
            cannot: [
                {
                    what: "export of every set",
                    reason: "a standard is authored in its repository, never read back from the app",
                },
                {
                    what: "mirror removal of every set",
                    reason: "an import merges: what the standard no longer names is reported and left",
                },
                ...RETIRED_SETS.map((name) => ({ what: `import of set ${name}`, reason: RETIRED_REASON })),
            ],
        })
    }

    /** Yields nothing: a standard is never exported from the app. */
    export(): AsyncIterable<DataEntry> {
        return NO_ENTRIES
    }

    /**
     * Merges the entries into the sets, by natural key. A dry run only plans (nothing is written); mode `mirror` is allowed in a dry
     * run alone, where it counts the keys the entries do not name as `removed`.
     */
    async import(entries: AsyncIterable<DataEntry>, options: ImportOptions): Promise<ImportReport> {
        if (options.mode === "mirror" && !options.dryRun) throw new SeedRefusal("SEED_MIRROR_NOT_SUPPORTED")
        const tallies = new Map<string, Tally>()
        for await (const entry of entries) {
            const tally = tallies.get(entry.set) ?? emptyTally()
            tallies.set(entry.set, tally)
            tally.seen.add(entry.key)
            await this.take(entry, tally, options.dryRun)
        }
        const sets: Array<SetImport> = []
        for (const [name, tally] of [...tallies].sort(([left], [right]) => byName(left, right))) {
            const held = this.sets.find((set) => set.set === name)
            const absent =
                options.mode === "mirror" && held !== undefined
                    ? (await held.keys()).filter((key) => !tally.seen.has(key))
                    : []
            sets.push({
                set: name,
                created: tally.created,
                updated: tally.updated,
                unchanged: tally.unchanged,
                removed: absent.length,
                refused: tally.refused,
            })
        }
        const moved = sets.some((item) => item.created + item.updated > 0)
        const refused = sets.some((item) => item.refused.length > 0)
        return { sets, outcome: refused ? "partial" : moved ? "applied" : "unchanged" }
    }

    /** The identity of the row a key names in a set, or null when the set is not held. */
    identityOf(set: string, key: string): Promise<StoreIdentity> {
        const held = this.sets.find((candidate) => candidate.set === set)
        return held === undefined ? Promise.resolve(null) : held.identityOf(key)
    }

    private async take(entry: DataEntry, tally: Tally, dryRun: boolean): Promise<void> {
        if (RETIRED_SETS.includes(entry.set)) {
            tally.unchanged += 1
            return
        }
        const held = this.sets.find((set) => set.set === entry.set)
        if (held === undefined) {
            tally.refused.push({ key: entry.key, code: "SEED_SET_NOT_HELD" })
            return
        }
        try {
            const value: unknown = recordValue(entry)
            const outcome = dryRun ? await held.plan(entry.key, value) : await held.apply(entry.key, value)
            tally[outcome] += 1
        } catch (cause) {
            if (!(cause instanceof SeedRefusal)) throw cause
            tally.refused.push({ key: entry.key, code: cause.code })
        }
    }
}
