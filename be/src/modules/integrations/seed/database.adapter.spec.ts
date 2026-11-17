import { recordEntry, type DataEntry } from "@starci/seed"
import { DatabaseStore, RETIRED_SETS } from "./database.adapter"
import type { SeedOutcome, SeedSet } from "./seed.contracts"
import { SeedRefusal } from "./seed.errors"

const entriesOf = (list: ReadonlyArray<DataEntry>): AsyncIterable<DataEntry> => ({
    [Symbol.asyncIterator]: async function* () {
        await Promise.resolve()
        yield* list
    },
})

const setOf = (outcomes: Record<string, SeedOutcome | "refuse">, held: ReadonlyArray<string> = []): SeedSet => ({
    set: "lessons",
    plan: (key) => answer(outcomes[key] ?? "unchanged"),
    apply: (key) => answer(outcomes[key] ?? "unchanged"),
    keys: () => Promise.resolve(held),
    identityOf: (key) => Promise.resolve(key),
})

const answer = (outcome: SeedOutcome | "refuse"): Promise<SeedOutcome> =>
    outcome === "refuse" ? Promise.reject(new SeedRefusal("LESSON_RECORD_INVALID")) : Promise.resolve(outcome)

describe("DatabaseStore", () => {
    it("is the logical database store the stack declaration names", () => {
        const store = new DatabaseStore([])

        expect([store.id, store.kind, store.level]).toEqual(["database", "database", "logical"])
    })

    it("describes the sets it holds and the retired ones, and says what it cannot do", async () => {
        const store = new DatabaseStore([setOf({})])

        const description = await store.describe()

        expect(description.sets.map((set) => set.set)).toEqual([
            "interview-overlay",
            "interview-overlay-index",
            "lessons",
        ])
        expect([description.canImport, description.canExport, description.purposes]).toEqual([
            true,
            false,
            ["seed-standard"],
        ])
        expect(description.cannot.map((item) => item.what)).toContain("import of set interview-overlay")
    })

    it("exports no entry", async () => {
        const first = await new DatabaseStore([]).export()[Symbol.asyncIterator]().next()

        expect(first.done).toBe(true)
    })

    it("counts what each key did, refuses a record a set cannot hold and a set nobody holds, and leaves a retired set alone", async () => {
        const store = new DatabaseStore([setOf({ a: "created", b: "updated", c: "unchanged", d: "refuse" })])
        const entries = ["a", "b", "c", "d"].map((key) => recordEntry("lessons", key, { id: key }))

        const report = await store.import(
            entriesOf([
                ...entries,
                recordEntry("interview-overlay", "x/y/1", {}),
                recordEntry("harness-builds", "agent-cli", {}),
            ]),
            { dryRun: false, mode: "merge" },
        )

        expect(report.outcome).toBe("partial")
        expect(report.sets).toEqual([
            {
                set: "harness-builds",
                created: 0,
                updated: 0,
                unchanged: 0,
                removed: 0,
                refused: [{ key: "agent-cli", code: "SEED_SET_NOT_HELD" }],
            },
            { set: "interview-overlay", created: 0, updated: 0, unchanged: 1, removed: 0, refused: [] },
            {
                set: "lessons",
                created: 1,
                updated: 1,
                unchanged: 1,
                removed: 0,
                refused: [{ key: "d", code: "LESSON_RECORD_INVALID" }],
            },
        ])
        expect(RETIRED_SETS).toContain("interview-overlay")
    })

    it("counts, in a mirror dry run, the keys the standard no longer names and removes nothing", async () => {
        const store = new DatabaseStore([setOf({}, ["a", "old"])])

        const report = await store.import(entriesOf([recordEntry("lessons", "a", { id: "a" })]), {
            dryRun: true,
            mode: "mirror",
        })

        expect(report.sets[0]?.removed).toBe(1)
        expect(report.outcome).toBe("unchanged")
    })

    it("refuses a mirror that would write", async () => {
        const store = new DatabaseStore([])

        await expect(store.import(entriesOf([]), { dryRun: false, mode: "mirror" })).rejects.toThrow(
            "SEED_MIRROR_NOT_SUPPORTED",
        )
    })

    it("answers the identity a set gives, and none for a set nobody holds", async () => {
        const store = new DatabaseStore([setOf({})])

        await expect(store.identityOf("lessons", "a")).resolves.toBe("a")
        await expect(store.identityOf("nothing", "a")).resolves.toBeNull()
    })
})
