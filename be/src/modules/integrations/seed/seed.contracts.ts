/** A store's own identity of the row or object a natural key names (a database id, an object version), or null when it holds none. */
export type StoreIdentity = string | null

/** What a set did with one entry: a key it did not hold, a key whose content changed, or a key already equal. */
export type SeedOutcome = "created" | "updated" | "unchanged"

/**
 * One set of the database store, written by the domain capability that owns its tables. The store hands it the decoded record of
 * an entry; the set judges and upserts it by natural key and keeps the identity of the row it updates (PROJECT-STACKS-14).
 */
export interface SeedSet {
    /** The set name the standard carries (kebab-case). */
    readonly set: string
    /** What `apply` would answer for the entry, writing nothing. Throws `SeedRefusal` for a record it cannot hold. */
    plan(key: string, value: unknown): Promise<SeedOutcome>
    /** Upserts the entry by its natural key and answers what it did. Throws `SeedRefusal` for a record it cannot hold. */
    apply(key: string, value: unknown): Promise<SeedOutcome>
    /** Every natural key the set holds now, so a mirror can say what the standard no longer names. */
    keys(): Promise<ReadonlyArray<string>>
    /** The store's own identity of the row a key names, or null when it holds none. */
    identityOf(key: string): Promise<StoreIdentity>
}
