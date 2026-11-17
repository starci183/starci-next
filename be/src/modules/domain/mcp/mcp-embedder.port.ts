import { injector, type TypedParameterDecorator } from "@modules/platform/composition"

/**
 * The port that turns texts into unit vectors of `EMBEDDING_DIMENSIONS` values. It answers null when no embedder is configured
 * or it cannot be reached, so a caller falls back to keywords; it never throws for an outage. An object, not a bare function, so
 * a unit spec doubles it with `mock<McpEmbedder>()`. The Ollama adapter serves it until `@starci/ai-router` 0.10.0 (`kind:"local"`,
 * `qwen3-embedding:8b`, MRL 1024) is on npm; its adapter then replaces the Ollama one behind this same port.
 */
export interface McpEmbedder {
    /** Whether an embedder is configured at all (false means keyword search only). */
    readonly isConfigured: boolean
    /**
     * The identity of the model and cut (for example `qwen3-embedding:8b/1024`): part of every content hash, so changing the
     * model re-embeds everything and never mixes two models in one index.
     */
    readonly model: string
    /** One vector per text in order, or null when the embedder is off or unreachable. */
    embed(texts: ReadonlyArray<string>): Promise<ReadonlyArray<ReadonlyArray<number>> | null>
}

/** Token of the port that embeds texts. */
export const MCP_EMBEDDER: unique symbol = Symbol("domain.mcp.embedder")

/** Injects the port that embeds texts. Parameter type: McpEmbedder. */
export const InjectMcpEmbedder = (): TypedParameterDecorator<McpEmbedder> => injector<McpEmbedder>(MCP_EMBEDDER)
