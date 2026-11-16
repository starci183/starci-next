import { Injectable } from "@nestjs/common"
import { InjectMcpEmbedder, type McpEmbedder } from "./mcp-embedder.port"
import { cosineOf, type Chunk } from "./mcp-embedding.policy"
import { HIT_TEXT_MAX, HITS_MAX } from "./mcp-source.policy"
import type { McpSearchHit } from "./mcp.contracts"

/** The instruction the query side of the embedding model is given. */
const QUERY_PREFIX =
    "Instruct: Given a learner's question about a software lesson, retrieve the passages that answer it\nQuery: "
/** The most chunks one corpus holds and the most corpora kept; the oldest corpus is dropped first. */
const CHUNKS_MAX = 600
const CORPORA_MAX = 32

interface Corpus {
    readonly chunks: ReadonlyArray<Chunk>
    readonly vectors: ReadonlyArray<ReadonlyArray<number>>
}

@Injectable()
/**
 * The semantic index of what one learner may read: chunks embedded once per corpus key and kept in memory, ranked by cosine.
 * A corpus is keyed by the exact text it holds, so a learner who may read less never shares a corpus with one who may read
 * more, and nothing outside what the caller passes in is ever embedded or returned. The store is in-process on purpose: the
 * development database image has no pgvector, and a corpus is a few hundred chunks; a pgvector (HNSW) store fits behind the
 * same `search` method when the image carries the extension.
 */
export class McpVectorIndex {
    private readonly corpora = new Map<string, Corpus>()

    constructor(@InjectMcpEmbedder() private readonly embedder: McpEmbedder) {}

    /** Whether semantic search is configured (it may still fall back when the embedder is unreachable). */
    get isConfigured(): boolean {
        return this.embedder.isConfigured
    }

    /** The best chunks for a question out of the corpus, or null when the embedder is off or unreachable (the caller falls back). */
    async search(
        key: string,
        chunks: ReadonlyArray<Chunk>,
        query: string,
    ): Promise<ReadonlyArray<McpSearchHit> | null> {
        if (!this.embedder.isConfigured || chunks.length === 0) return null
        const corpus = await this.corpusOf(key, chunks.slice(0, CHUNKS_MAX))
        if (corpus === null) return null
        const asked = await this.embedder.embed([`${QUERY_PREFIX}${query}`])
        const vector = asked?.[0]
        if (vector === undefined) return null
        return corpus.chunks
            .map((chunk, index) => ({ chunk, score: cosineOf(vector, corpus.vectors[index] ?? []) }))
            .sort((a, b) => b.score - a.score)
            .slice(0, HITS_MAX)
            .map(({ chunk, score }) => ({
                path: chunk.path,
                line: chunk.line,
                text: chunk.text.trim().slice(0, HIT_TEXT_MAX * 4),
                score: Math.round(score * 1000) / 1000,
            }))
    }

    private async corpusOf(key: string, chunks: ReadonlyArray<Chunk>): Promise<Corpus | null> {
        const cached = this.corpora.get(key)
        if (cached !== undefined) return cached
        const vectors = await this.embedder.embed(chunks.map((chunk) => chunk.text))
        if (vectors === null) return null
        const corpus: Corpus = { chunks, vectors }
        this.corpora.set(key, corpus)
        if (this.corpora.size > CORPORA_MAX) {
            const oldest = this.corpora.keys().next().value
            if (oldest !== undefined) this.corpora.delete(oldest)
        }
        return corpus
    }
}
