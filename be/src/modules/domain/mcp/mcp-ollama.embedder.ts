import { Injectable } from "@nestjs/common"
import type { McpEmbedder } from "./mcp-embedder.port"
import { truncatedUnitVectorOf } from "./mcp-embedding.policy"
import { InjectMcpOptions } from "./mcp.decorators"
import type { McpOptions } from "./mcp.options"

/** The most texts one `/api/embed` call carries, and the longest the call may take. */
const BATCH_TEXTS = 16
const CALL_TIMEOUT_MS = 30_000

@Injectable()
/**
 * The thin adapter of the local embedder: Ollama's `POST /api/embed` with `qwen3-embedding:8b` (4096 dimensions), each vector
 * cut to 1024 and normalised. Off when `MCP_EMBED_URL` is not declared; any failure answers null so search falls back to keywords.
 */
export class McpOllamaEmbedder implements McpEmbedder {
    readonly isConfigured: boolean

    constructor(@InjectMcpOptions() private readonly options: McpOptions) {
        this.isConfigured = options.embed !== null
    }

    /** Embeds the texts in batches; null when the embedder is off, unreachable, slow or answers something unexpected. */
    async embed(texts: ReadonlyArray<string>): Promise<ReadonlyArray<ReadonlyArray<number>> | null> {
        const embed = this.options.embed
        if (embed === null) return null
        const vectors: Array<Array<number>> = []
        try {
            for (let start = 0; start < texts.length; start += BATCH_TEXTS) {
                const batch = texts.slice(start, start + BATCH_TEXTS)
                const response = await fetch(new URL("/api/embed", embed.url), {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ model: embed.model, input: batch, truncate: true }),
                    signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
                })
                if (!response.ok) return null
                const body = (await response.json()) as { embeddings?: unknown }
                if (!Array.isArray(body.embeddings) || body.embeddings.length !== batch.length) return null
                for (const raw of body.embeddings as Array<unknown>) {
                    const vector = Array.isArray(raw) ? truncatedUnitVectorOf(raw as Array<number>) : null
                    if (vector === null) return null
                    vectors.push(vector)
                }
            }
        } catch {
            return null
        }
        return vectors
    }
}
