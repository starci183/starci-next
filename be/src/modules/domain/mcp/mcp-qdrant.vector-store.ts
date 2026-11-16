import { createHash } from "node:crypto"
import { Injectable } from "@nestjs/common"
import type { EntityManager } from "typeorm"
import { InjectClock, type Clock } from "@modules/platform/clock"
import { InjectPrimaryEntityManager, type sql } from "@modules/platform/database"
import { InjectVectorIndex, type VectorIndex } from "@modules/integrations/qdrant"
import {
    scopeKeyOf,
    type McpAccess,
    type McpNearest,
    type McpScope,
    type McpStoredChunk,
    type McpVectorStore,
} from "./mcp-vector-store.port"
import {
    DELETE_POINT_ROWS,
    MARK_POINTS_SYNCED,
    SELECT_KNOWN_POINTS,
    SELECT_POINT_HASHES,
    SELECT_STALE_POINTS,
    UPDATE_POINT_ACCESS,
    UPSERT_POINT_ROWS,
} from "./persistence/mcp.sql"

type SqlText = ReturnType<typeof sql>

/** The payload fields the filters read; the Qdrant module indexes each. */
export const MCP_PAYLOAD_INDEXES: ReadonlyArray<string> = ["kind", "source_id", "locale", "access", "hash"]

/** The most hashes one filtered search names (a corpus is cut to this many chunks). */
const HASHES_MAX = 600

/**
 * The id of the point of a chunk: a UUID derived from the scope and the content hash, so writing the same chunk twice is the same
 * point and the Postgres row and the Qdrant point can always be matched without a lookup.
 */
export const pointIdOf = (scope: McpScope, hash: string): string => {
    const bytes = createHash("sha256").update(`${scopeKeyOf(scope)}\u0000${hash}`).digest().subarray(0, 16)
    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80
    const hex = bytes.toString("hex")
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
}

@Injectable()
/**
 * The vector store of the MCP semantic search, the way NIVO keeps its brain: a Postgres row per indexed chunk
 * (`mcp_vector_points`: content hash, source, access class, sync time) and one Qdrant point under the row point id carrying only
 * the keywords the filters read. A write is rows first (pending), then the points, then the sync time, so a lost write leaves a
 * pending row the next job writes again; a search runs in Qdrant under a mandatory payload filter (kind, source, locale, the
 * access classes the reader may see, and for a private corpus the hashes of what the reader may read) and the hashes are read
 * back from Postgres. A failure throws and the index falls back to keywords.
 */
export class McpQdrantVectorStore implements McpVectorStore {
    readonly isConfigured = true
    private ready: Promise<void> | null = null

    constructor(
        @InjectPrimaryEntityManager() private readonly entityManager: EntityManager,
        @InjectVectorIndex() private readonly index: VectorIndex,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** The synced chunks of the scope among the hashes, with their access class. */
    async known(scope: McpScope, hashes: ReadonlyArray<string>): Promise<ReadonlyMap<string, McpAccess>> {
        if (hashes.length === 0) return new Map()
        const rows: Array<{ content_hash: string; access: McpAccess }> = await this.run(SELECT_KNOWN_POINTS, [
            scope.kind,
            scope.sourceId,
            scope.locale,
            [...hashes],
        ])
        return new Map(rows.map((row) => [row.content_hash, row.access]))
    }

    /** Writes the chunks: pending rows, then the Qdrant points, then the sync time. */
    async put(scope: McpScope, chunks: ReadonlyArray<McpStoredChunk>, access: McpAccess): Promise<void> {
        if (chunks.length === 0) return
        await this.prepared()
        const ids = chunks.map((chunk) => pointIdOf(scope, chunk.hash))
        await this.run(UPSERT_POINT_ROWS, [
            scope.kind,
            scope.sourceId,
            scope.locale,
            access,
            ids,
            chunks.map((chunk) => chunk.hash),
            chunks.map((chunk) => chunk.part),
        ])
        await this.index.upsert(
            chunks.map((chunk, position) => ({
                pointId: ids[position] ?? "",
                vector: chunk.vector,
                payload: {
                    kind: scope.kind,
                    source_id: scope.sourceId,
                    locale: scope.locale,
                    access,
                    hash: chunk.hash,
                    part: chunk.part,
                },
            })),
        )
        await this.run(MARK_POINTS_SYNCED, [ids, this.clock.now()])
    }

    /** Re-labels the chunks in Postgres and in Qdrant. */
    async retag(scope: McpScope, hashes: ReadonlyArray<string>, access: McpAccess): Promise<void> {
        if (hashes.length === 0) return
        const rows: Array<{ point_id: string }> = await this.run(UPDATE_POINT_ACCESS, [
            scope.kind,
            scope.sourceId,
            scope.locale,
            [...hashes],
            access,
        ])
        await this.index.setPayload(
            rows.map((row) => row.point_id),
            { access },
        )
    }

    /** The nearest chunks, found in Qdrant under the payload filter and mapped back to hashes through Postgres. */
    async nearest(
        scope: McpScope,
        vector: ReadonlyArray<number>,
        limit: number,
        readable: ReadonlyArray<McpAccess>,
        only: ReadonlyArray<string> | null,
    ): Promise<ReadonlyArray<McpNearest>> {
        const must = [
            { key: "kind", any: [scope.kind] },
            { key: "source_id", any: [scope.sourceId] },
            { key: "locale", any: [scope.locale] },
            { key: "access", any: readable },
            ...(only === null ? [] : [{ key: "hash", any: only.slice(0, HASHES_MAX) }]),
        ]
        const matches = await this.index.search(must, vector, limit)
        if (matches.length === 0) return []
        const rows: Array<{ point_id: string; content_hash: string }> = await this.run(SELECT_POINT_HASHES, [
            matches.map((match) => match.pointId),
        ])
        const hashOf = new Map(rows.map((row) => [row.point_id, row.content_hash]))
        return matches.flatMap((match) => {
            const hash = hashOf.get(match.pointId)
            return hash === undefined ? [] : [{ hash, score: match.score }]
        })
    }

    /** Deletes the scope's chunks outside `keep`: the Qdrant points first, then their rows. */
    async prune(scope: McpScope, keep: ReadonlyArray<string>): Promise<number> {
        const rows: Array<{ point_id: string }> = await this.run(SELECT_STALE_POINTS, [
            scope.kind,
            scope.sourceId,
            scope.locale,
            [...keep],
        ])
        if (rows.length === 0) return 0
        const ids = rows.map((row) => row.point_id)
        await this.index.remove(ids)
        await this.run(DELETE_POINT_ROWS, [ids])
        return ids.length
    }

    /** Prepares the collection once per process; a failure is tried again by the next call. */
    private prepared(): Promise<void> {
        if (this.ready === null) {
            this.ready = this.index.ensure().catch((cause: unknown) => {
                this.ready = null
                throw cause
            })
        }
        return this.ready
    }

    private run<T>(statement: SqlText, params: ReadonlyArray<unknown>): Promise<T> {
        return this.entityManager.query(statement, [...params])
    }
}
