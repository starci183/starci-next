import { Injectable } from "@nestjs/common"
import { createRouter, localModel } from "@starci/ai-router/gateway"
import type { McpEmbedder } from "./mcp-embedder.port"
import { EMBEDDING_DIMENSIONS, truncatedUnitVectorOf } from "./mcp-embedding.policy"
import { InjectMcpIndexOptions } from "./mcp-index.decorators"
import type { McpIndexOptions } from "./mcp-index.options"

/** The most texts one embeddings call carries. */
const BATCH_TEXTS = 16
/** The pinned profile of the embeddings space: the model never changes under the index. */
const PROFILE = "local-embed"

/** The OpenAI-compatible base of an Ollama server: `http://host:11434` and `http://host:11434/v1` both name it. */
export const localBaseUrlOf = (url: string): string => {
    const root = url.replace(/\/+$/u, "")
    return root.endsWith("/v1") ? root : `${root}/v1`
}

@Injectable()
/**
 * The embedder behind the port: `@starci/ai-router` `kind:"local"` (keyless, cost 0) serving `qwen3-embedding:8b` cut to 1024
 * dimensions by MRL truncation and L2-normalised, declared in code. Off when `MCP_EMBED_URL` is not declared; any failure
 * answers null so search falls back to keywords.
 */
export class McpRouterEmbedder implements McpEmbedder {
    readonly isConfigured: boolean
    readonly model: string
    private readonly router: ReturnType<typeof createRouter> | null

    constructor(@InjectMcpIndexOptions() options: McpIndexOptions) {
        const embed = options.embed
        this.isConfigured = embed !== null
        this.model = `${embed?.model ?? "off"}/${EMBEDDING_DIMENSIONS}`
        this.router =
            embed === null
                ? null
                : createRouter({
                      providers: [
                          {
                              id: "gpu",
                              kind: "local",
                              baseUrl: localBaseUrlOf(embed.url),
                              keys: [],
                              models: [localModel(embed.model, { dimensions: EMBEDDING_DIMENSIONS })],
                          },
                      ],
                      profiles: { [PROFILE]: { pinned: true, model: embed.model, providers: ["gpu"] } },
                  })
    }

    /** Embeds the texts in batches; null when the embedder is off, unreachable or answers vectors of another size. */
    async embed(texts: ReadonlyArray<string>): Promise<ReadonlyArray<ReadonlyArray<number>> | null> {
        if (this.router === null) return null
        const vectors: Array<Array<number>> = []
        try {
            for (let start = 0; start < texts.length; start += BATCH_TEXTS) {
                const batch = texts.slice(start, start + BATCH_TEXTS)
                const { data } = await this.router.embeddings({ model: PROFILE, input: batch })
                const ordered = [...data].sort((a, b) => a.index - b.index)
                if (ordered.length !== batch.length) return null
                for (const item of ordered) {
                    const vector = Array.isArray(item.embedding)
                        ? truncatedUnitVectorOf(item.embedding as Array<number>)
                        : null
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
