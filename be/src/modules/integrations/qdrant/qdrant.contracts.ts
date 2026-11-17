/** One point: its id, its vector and the payload the filters read. It carries no text. */
export interface VectorPoint {
    /** The point id (a UUID, the id of its Postgres row). */
    readonly pointId: string
    /** The vector. */
    readonly vector: ReadonlyArray<number>
    /** The payload fields the filters read, each a short keyword. */
    readonly payload: Readonly<Record<string, string>>
}

/** One condition of a filter: the payload field holds one of these values. */
export interface VectorCondition {
    /** The payload field (one the module was registered to index). */
    readonly key: string
    /** The accepted values; at least one. */
    readonly any: ReadonlyArray<string>
}

/** One nearest point: its id and its score; the row is read back from Postgres. */
export interface VectorMatch {
    /** The point id. */
    readonly pointId: string
    /** The similarity score, larger is nearer. */
    readonly score: number
}

/**
 * The vector index port: the only door to the vectors. A search takes a MANDATORY non-empty list of conditions that must all
 * hold (the index refuses a search without them); no method takes a free-form filter.
 */
export interface VectorIndex {
    /** Prepares the collection and its payload indexes; safe to repeat. A collection of another size is refused. */
    ensure(): Promise<void>
    /** Stores the points in place of those of the same ids. */
    upsert(points: ReadonlyArray<VectorPoint>): Promise<void>
    /** Replaces payload fields of the points of these ids, leaving their vectors. */
    setPayload(pointIds: ReadonlyArray<string>, payload: Readonly<Record<string, string>>): Promise<void>
    /** Removes the points of these ids. */
    remove(pointIds: ReadonlyArray<string>): Promise<void>
    /** The points nearest to the vector among those that satisfy every condition, nearest first. */
    search(
        must: ReadonlyArray<VectorCondition>,
        vector: ReadonlyArray<number>,
        limit: number,
    ): Promise<ReadonlyArray<VectorMatch>>
}
