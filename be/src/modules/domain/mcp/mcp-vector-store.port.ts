import { injector, type TypedParameterDecorator } from "@modules/platform/composition"

/** Who may read a chunk: `free` is open to every learner, `premium` only to a Premium learner. */
export type McpAccess = "free" | "premium"

/** One corpus the index keeps apart: the lessons text, one lesson repository, or the harness guides and docs. */
export interface McpScope {
    /** `lesson` (the unlocked sections of a lesson), `code` (a lesson repository) or `harness` (the guides and docs). */
    readonly kind: "lesson" | "code" | "harness"
    /** The lesson id, or `harness`. */
    readonly sourceId: string
    /** The locale of the text, or `und` for code. */
    readonly locale: string
}

/** One embedded chunk handed to the store: the hash of its content (model included), its vector and where it sits. */
export interface McpStoredChunk {
    /** The content hash, the key of the chunk inside its scope. */
    readonly hash: string
    /** The unit vector. */
    readonly vector: ReadonlyArray<number>
    /** The part of the corpus it sits in (`section/<n>`, a file path, a guide path). */
    readonly part: string
}

/** One nearest neighbour: the content hash and its cosine similarity to the query. */
export interface McpNearest {
    /** The content hash of the chunk. */
    readonly hash: string
    /** The cosine similarity, best near 1. */
    readonly score: number
}

/**
 * The port of the vector store. The store holds vectors and their gating only, keyed by content hash: the text stays with the
 * caller, who names the access class a chunk is written with, the classes the reader may see and, for a private corpus, the
 * hashes of exactly what the reader may read now. Any failure throws; the index turns it into a keyword fallback. An object, not
 * a bare function, so a unit spec doubles it.
 */
export interface McpVectorStore {
    /** Whether a store is declared at all (false means keyword search only). */
    readonly isConfigured: boolean
    /** The subset of the hashes already stored in the scope, with the access class each is stored under. */
    known(scope: McpScope, hashes: ReadonlyArray<string>): Promise<ReadonlyMap<string, McpAccess>>
    /** Stores the chunks in the scope under an access class; a hash already there keeps its vector. */
    put(scope: McpScope, chunks: ReadonlyArray<McpStoredChunk>, access: McpAccess): Promise<void>
    /** Re-labels stored chunks with another access class, without embedding them again. */
    retag(scope: McpScope, hashes: ReadonlyArray<string>, access: McpAccess): Promise<void>
    /**
     * The nearest stored chunks of the scope to the vector among the classes the reader may see, best first; with `only`,
     * restricted to those hashes.
     */
    nearest(
        scope: McpScope,
        vector: ReadonlyArray<number>,
        limit: number,
        readable: ReadonlyArray<McpAccess>,
        only: ReadonlyArray<string> | null,
    ): Promise<ReadonlyArray<McpNearest>>
    /** Deletes the scope's chunks whose hash is not in `keep`; answers how many were deleted. */
    prune(scope: McpScope, keep: ReadonlyArray<string>): Promise<number>
}

/** Token of the port that stores vectors. */
export const MCP_VECTOR_STORE: unique symbol = Symbol("domain.mcp.vector-store")

/** Injects the port that stores vectors. Parameter type: McpVectorStore. */
export const InjectMcpVectorStore = (): TypedParameterDecorator<McpVectorStore> =>
    injector<McpVectorStore>(MCP_VECTOR_STORE)

/** The key of a scope in a map or a log line. */
export const scopeKeyOf = (scope: McpScope): string => `${scope.kind}:${scope.sourceId}:${scope.locale}`
