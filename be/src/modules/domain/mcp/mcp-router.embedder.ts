import { Injectable } from "@nestjs/common"
import { createRouter, localModel } from "@starci/ai-router/gateway"
import type { McpEmbedder } from "./mcp-embedder.port"
import { EMBEDDING_DIMENSIONS, truncatedUnitVectorOf } from "./mcp-embedding.policy"
import { InjectMcpIndexOptions } from "./mcp-index.decorators"
import type { McpIndexOptions } from "./mcp-index.options"

/** The most texts one embeddings call carries. */
const BATCH_TEXTS = 16
/**
 * The most characters one embeddings call carries: the router sizes a call at a quarter of its characters in tokens and refuses
 * one above the 4096-token window of the model, so a batch of long chunks is cut by size as well as by count.
 */
const BATCH_CHARS = 12_000
/** The pinned profile of the embeddings space: the model never changes under the index. */
const PROFILE = "local-embed"

/** The OpenAI-compatible base of an Ollama server: `http://host:11434` and `http://host:11434/v1` both name it. */
export const localBaseUrlOf = (url: string): string => {
    const root = url.replace(/\/+$/u, "")
    return root.endsWith("/v1") ? root : `${root}/v1`
}

/** Cuts the texts, in order, into batches of at most `BATCH_TEXTS` texts and `BATCH_CHARS` characters (a longer text goes alone). */
export const batchesOf = (texts: ReadonlyArray<string>): Array<Array<string>> => {
    const batches: Array<Array<string>> = []
    let size = 0
    for (const text of texts) {
        const last = batches[batches.length - 1]
        if (last === undefined || last.length >= BATCH_TEXTS || size + text.length > BATCH_CHARS) {
            batches.push([text])
            size = text.length
        } else {
            last.push(text)
            size += text.length
        }
    }
    return batches
}

@Injectable()
/**
 * The embedder behind the port: `@starci/ai-router` `kind:"local"` (the token of the shared host service is read from the sealed `AI_API_KEY` at each call, never logged) serving `qwen3-embedding:8b` cut to 1024
 * dimensions by MRL truncation and L2-normalised, declared in code. Off when `MCP_EMBED_URL` is not declared; any failure
 * answers null so search falls back to keywords.
 */
export class McpRouterEmbedder implements McpEmbedder {
    readonly isConfigured: boolean
    readonly model: string
    private readonly modelName: string
    private readonly router: ReturnType<typeof createRouter> | null

    constructor(@InjectMcpIndexOptions() options: McpIndexOptions) {
        const embed = options.embed
        this.isConfigured = embed !== null
        this.modelName = embed?.model ?? "off"
        this.model = `${this.modelName}/${EMBEDDING_DIMENSIONS}`
        this.router =
            embed === null
                ? null
                : createRouter({
                      providers: [
                          {
                              id: "gpu",
                              kind: "local",
                              baseUrl: localBaseUrlOf(embed.url),
                              keys:
                                  embed.apiKey === null
                                      ? []
                                      : [{ alias: "embed", resolve: () => embed.apiKey?.reveal() }],
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
            for (const batch of batchesOf(texts)) {
                // The request names the model; the pinned profile keeps every call on that one model space and its provider.
                const { data } = await this.router.embeddings(
                    { model: this.modelName, input: batch },
                    { profile: PROFILE },
                )
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
