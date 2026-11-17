import { Injectable } from "@nestjs/common"
import { InjectClock, type Clock } from "@modules/platform/clock"
import type { LessonLocale } from "@modules/domain/lesson"
import {
    HARNESS_LOCALES,
    harnessChunksOf,
    harnessCorpusOf,
    harnessDocumentsOf,
    type McpHarnessDocument,
} from "./mcp-harness.policy"
import { InjectMcpHarnessSource, type McpHarnessSource } from "./mcp-harness-source.port"
import { keywordHitsOf } from "./mcp-source.policy"
import { McpVectorIndex, type McpSyncReport } from "./mcp-vector.index"
import type { McpSearchResult } from "./mcp.contracts"

/** How long the read corpus is reused before the content checkout is read again. */
const CORPUS_TTL_MS = 30_000

/** The result of the batch job for the whole harness corpus. */
export interface McpHarnessReindexReport {
    /** The documents the index may read, both locales. */
    readonly documents: number
    /** One report per locale; a locale whose embedder or store was unreachable is absent. */
    readonly scopes: ReadonlyArray<McpSyncReport>
}

@Injectable()
/**
 * The harness guides and docs for `search_harness`: free to every learner with a token (no entitlement is asked), read only
 * through `harnessDocumentsOf`, so a build kit, a hidden test, a rubric, an answer or a credential is never listed, searched or
 * embedded. Search is semantic when the embedder and pgvector answer and keywords otherwise. `reindex` is the batch job: it
 * embeds only the chunks whose content hash is new and drops the chunks no document holds any more.
 */
export class McpHarnessService {
    private cached: { readonly at: number; readonly documents: ReadonlyArray<McpHarnessDocument> } | null = null

    constructor(
        @InjectMcpHarnessSource() private readonly source: McpHarnessSource,
        private readonly vectors: McpVectorIndex,
        @InjectClock() private readonly clock: Clock,
    ) {}

    /** A search over the guides and docs of one locale: semantic when asked and available, keywords otherwise. */
    async search(locale: LessonLocale, query: string, semantic: boolean): Promise<McpSearchResult> {
        const texts = (await this.documents()).filter((document) => document.locale === locale)
        if (semantic && this.vectors.isConfigured) {
            const chunks = texts.flatMap((document) => harnessChunksOf(document))
            const hits = await this.vectors.search(harnessCorpusOf(locale), chunks, query, "scope")
            if (hits !== null) return { mode: "semantic", fellBack: false, hits }
        }
        return { mode: "keyword", fellBack: semantic, hits: keywordHitsOf(texts, query) }
    }

    /** The batch job: reads the content afresh and syncs every locale's scope incrementally. */
    async reindex(): Promise<McpHarnessReindexReport> {
        this.cached = null
        const documents = await this.documents()
        const scopes: Array<McpSyncReport> = []
        for (const locale of HARNESS_LOCALES) {
            const chunks = documents
                .filter((document) => document.locale === locale)
                .flatMap((document) => harnessChunksOf(document))
            const report = await this.vectors.sync(harnessCorpusOf(locale), chunks, true)
            if (report !== null) scopes.push(report)
        }
        return { documents: documents.length, scopes }
    }

    private async documents(): Promise<ReadonlyArray<McpHarnessDocument>> {
        const now = this.clock.now().getTime()
        if (this.cached !== null && now - this.cached.at < CORPUS_TTL_MS) return this.cached.documents
        const documents = harnessDocumentsOf(await this.source.files())
        this.cached = { at: now, documents }
        return documents
    }
}
