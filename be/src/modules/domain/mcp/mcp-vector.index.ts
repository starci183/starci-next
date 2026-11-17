import { Injectable } from "@nestjs/common"
import { InjectMcpEmbedder, type McpEmbedder } from "./mcp-embedder.port"
import { chunkHashOf, embedTextOf, type Chunk } from "./mcp-embedding.policy"
import { InjectMcpVectorStore, type McpAccess, type McpScope, type McpVectorStore } from "./mcp-vector-store.port"
import type { McpSearchHit } from "./mcp.contracts"

/** The instruction the query side of the embedding model is given. */
const QUERY_PREFIX =
    "Instruct: Given a learner's question about a software lesson, retrieve the passages that answer it\nQuery: "
/** The most chunks one search corpus holds (a lesson's readable text or one lesson repository). */
const CHUNKS_MAX = 2000
/** The most chunks one semantic search answers, and the most characters of a chunk it shows (the path and lines say where the rest is). */
const SEMANTIC_HITS_MAX = 10
/** How many nearest chunks are fetched before the literal boost cuts them to `SEMANTIC_HITS_MAX`. */
const CANDIDATES_MAX = 300
/** What a chunk that holds every word of a short query gains, so a word such as a command name finds the text that says it. */
const LITERAL_BOOST = 0.25
/** The longest query, in words, that is also matched literally. */
const LITERAL_WORDS_MAX = 3
const SEMANTIC_TEXT_MAX = 2000

/** The words of a short query (at most `LITERAL_WORDS_MAX`, three characters or more), or none for a long question. */
const literalWordsOf = (query: string): Array<string> => {
    const words = query
        .toLowerCase()
        .split(/\s+/u)
        .filter((word) => word !== "")
    return words.length > LITERAL_WORDS_MAX ? [] : words.filter((word) => word.length >= 3)
}

/**
 * One corpus a caller indexes or searches: where it lives, the access class its chunks are written with and the classes the
 * reader may see. A lesson read by a Premium learner writes `premium` and reads both; one read by a free learner writes and
 * reads `free`; the harness is `free` for everyone; a lesson repository is `premium`.
 */
export interface McpCorpus {
    /** The scope that keeps the corpus apart from the others. */
    readonly scope: McpScope
    /** The access class chunks are written with. */
    readonly access: McpAccess
    /** The access classes the reader may see. */
    readonly readable: ReadonlyArray<McpAccess>
}

/** What one sync of a corpus did: how many chunks it holds, how many it embedded, reused and pruned. */
export interface McpSyncReport {
    /** The scope that was synced, as `kind:source:locale`. */
    readonly scope: string
    /** The distinct chunks of the corpus (by content hash). */
    readonly chunks: number
    /** The chunks embedded now because their hash was not stored. */
    readonly embedded: number
    /** The chunks whose stored vector was reused. */
    readonly reused: number
    /** The stored chunks deleted because the corpus no longer holds them. */
    readonly pruned: number
}

/** How a search reads the store: among the hashes of the corpus the caller passed, or the whole scope (a public corpus). */
export type McpSearchReach = "corpus" | "scope"

interface Embedded {
    readonly byHash: ReadonlyMap<string, Chunk>
    readonly embedded: number
}

@Injectable()
/**
 * The semantic index of what the asker may read. Every chunk is keyed by the hash of its model and text, embedded only when that
 * hash is not stored yet (incremental), and ranked in the vector store under a payload filter of its scope and the access
 * classes the reader may see. A private corpus is also searched only among the hashes the caller passed, so a learner who may
 * read less never gets what a learner who may read more has stored, and nothing outside what the caller passes in is embedded.
 * Any failure of the embedder or the store answers null and the caller falls back to keywords.
 */
export class McpVectorIndex {
    constructor(
        @InjectMcpEmbedder() private readonly embedder: McpEmbedder,
        @InjectMcpVectorStore() private readonly store: McpVectorStore,
    ) {}

    /** Whether semantic search is configured (it may still fall back when the embedder or the store is unreachable). */
    get isConfigured(): boolean {
        return this.embedder.isConfigured && this.store.isConfigured
    }

    /** The best chunks for a question out of the corpus, or null when the embedder or the store is off or unreachable. */
    async search(
        corpus: McpCorpus,
        chunks: ReadonlyArray<Chunk>,
        query: string,
        reach: McpSearchReach = "corpus",
    ): Promise<ReadonlyArray<McpSearchHit> | null> {
        if (!this.isConfigured || chunks.length === 0) return null
        try {
            const embedded = await this.ensure(corpus, chunks.slice(0, CHUNKS_MAX))
            if (embedded === null) return null
            const asked = await this.embedder.embed([`${QUERY_PREFIX}${query}`])
            const vector = asked?.[0]
            if (vector === undefined) return null
            const near = await this.store.nearest(
                corpus.scope,
                vector,
                CANDIDATES_MAX,
                corpus.readable,
                reach === "scope" ? null : [...embedded.byHash.keys()],
            )
            const words = literalWordsOf(query)
            const ranked = near.flatMap(({ hash, score }) => {
                const chunk = embedded.byHash.get(hash)
                if (chunk === undefined) return []
                const text = chunk.text.toLowerCase()
                const literal = words.length > 0 && words.every((word) => text.includes(word))
                return [{ chunk, score: score + (literal ? LITERAL_BOOST : 0) }]
            })
            return ranked
                .sort((a, b) => b.score - a.score)
                .slice(0, SEMANTIC_HITS_MAX)
                .map(({ chunk, score }) => ({
                    path: chunk.path,
                    line: chunk.line,
                    ...(chunk.lineEnd === undefined ? {} : { endLine: chunk.lineEnd }),
                    ...(chunk.title === undefined || chunk.title === null ? {} : { title: chunk.title }),
                    text: chunk.text.trim().slice(0, SEMANTIC_TEXT_MAX),
                    score: Math.round(score * 1000) / 1000,
                }))
        } catch {
            return null
        }
    }

    /**
     * The batch job of a corpus: embeds only the chunks whose hash is not stored and, when `prune` is true, deletes the stored
     * chunks of the scope the corpus no longer holds. Null when the embedder or the store is off or unreachable.
     */
    async sync(corpus: McpCorpus, chunks: ReadonlyArray<Chunk>, prune: boolean): Promise<McpSyncReport | null> {
        if (!this.isConfigured) return null
        try {
            const embedded = await this.ensure(corpus, chunks)
            if (embedded === null) return null
            const pruned = prune ? await this.store.prune(corpus.scope, [...embedded.byHash.keys()]) : 0
            return {
                scope: `${corpus.scope.kind}:${corpus.scope.sourceId}:${corpus.scope.locale}`,
                chunks: embedded.byHash.size,
                embedded: embedded.embedded,
                reused: embedded.byHash.size - embedded.embedded,
                pruned,
            }
        } catch {
            return null
        }
    }

    private async ensure(corpus: McpCorpus, chunks: ReadonlyArray<Chunk>): Promise<Embedded | null> {
        const byHash = new Map<string, Chunk>()
        for (const chunk of chunks) {
            const hash = chunkHashOf(this.embedder.model, embedTextOf(chunk))
            if (!byHash.has(hash)) byHash.set(hash, chunk)
        }
        const accessOf = (chunk: Chunk): McpAccess => chunk.access ?? corpus.access
        const known = await this.store.known(corpus.scope, [...byHash.keys()])
        // A chunk stored as premium that its reader may read as free is opened to every free reader, with no new embedding.
        const reopened = [...known].flatMap(([hash, access]) => {
            const chunk = byHash.get(hash)
            return chunk !== undefined && access !== accessOf(chunk) && accessOf(chunk) === "free" ? [hash] : []
        })
        if (reopened.length > 0) await this.store.retag(corpus.scope, reopened, "free")
        const missing = [...byHash.entries()].filter(([hash]) => !known.has(hash))
        if (missing.length === 0) return { byHash, embedded: 0 }
        const vectors = await this.embedder.embed(missing.map(([, chunk]) => embedTextOf(chunk)))
        if (vectors === null || vectors.length !== missing.length) return null
        for (const access of ["free", "premium"] as const) {
            const group = missing.flatMap(([hash, chunk], index) =>
                accessOf(chunk) === access ? [{ hash, vector: vectors[index] ?? [], part: chunk.path }] : [],
            )
            await this.store.put(corpus.scope, group, access)
        }
        return { byHash, embedded: missing.length }
    }
}
