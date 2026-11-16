import { cosineOf } from "./mcp-embedding.policy"
import {
    scopeKeyOf,
    type McpAccess,
    type McpNearest,
    type McpScope,
    type McpStoredChunk,
    type McpVectorStore,
} from "./mcp-vector-store.port"

interface Held {
    readonly vector: ReadonlyArray<number>
    access: McpAccess
}

/**
 * The in-process vector store: the same port as the Qdrant one, kept for unit specs. It keeps every scope for the life of the
 * process, so use it only where that is acceptable.
 */
export class McpMemoryVectorStore implements McpVectorStore {
    readonly isConfigured = true
    private readonly scopes = new Map<string, Map<string, Held>>()

    /** The subset of the hashes already stored in the scope, with their access class. */
    known(scope: McpScope, hashes: ReadonlyArray<string>): Promise<ReadonlyMap<string, McpAccess>> {
        const held = this.scopes.get(scopeKeyOf(scope))
        const found = new Map<string, McpAccess>()
        for (const hash of hashes) {
            const item = held?.get(hash)
            if (item !== undefined) found.set(hash, item.access)
        }
        return Promise.resolve(found)
    }

    /** Stores the chunks in the scope; a hash already there keeps its vector. */
    put(scope: McpScope, chunks: ReadonlyArray<McpStoredChunk>, access: McpAccess): Promise<void> {
        const key = scopeKeyOf(scope)
        const held = this.scopes.get(key) ?? new Map<string, Held>()
        for (const { hash, vector } of chunks) if (!held.has(hash)) held.set(hash, { vector, access })
        this.scopes.set(key, held)
        return Promise.resolve()
    }

    /** Re-labels stored chunks. */
    retag(scope: McpScope, hashes: ReadonlyArray<string>, access: McpAccess): Promise<void> {
        const held = this.scopes.get(scopeKeyOf(scope))
        for (const hash of hashes) {
            const item = held?.get(hash)
            if (item !== undefined) item.access = access
        }
        return Promise.resolve()
    }

    /** The nearest stored chunks by cosine among the readable classes, best first. */
    nearest(
        scope: McpScope,
        vector: ReadonlyArray<number>,
        limit: number,
        readable: ReadonlyArray<McpAccess>,
        only: ReadonlyArray<string> | null,
    ): Promise<ReadonlyArray<McpNearest>> {
        const allowed = only === null ? null : new Set(only)
        const found = [...(this.scopes.get(scopeKeyOf(scope)) ?? [])]
            .filter(([hash, item]) => readable.includes(item.access) && (allowed === null || allowed.has(hash)))
            .map(([hash, item]) => ({ hash, score: cosineOf(vector, item.vector) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
        return Promise.resolve(found)
    }

    /** Deletes what the scope holds outside `keep`. */
    prune(scope: McpScope, keep: ReadonlyArray<string>): Promise<number> {
        const held = this.scopes.get(scopeKeyOf(scope))
        if (held === undefined) return Promise.resolve(0)
        const kept = new Set(keep)
        let removed = 0
        for (const hash of [...held.keys()])
            if (!kept.has(hash)) {
                held.delete(hash)
                removed += 1
            }
        return Promise.resolve(removed)
    }
}
