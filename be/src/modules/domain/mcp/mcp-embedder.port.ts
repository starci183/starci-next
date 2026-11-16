import { injector, type TypedParameterDecorator } from "@modules/platform/composition"

/**
 * The port that turns texts into unit vectors of `EMBEDDING_DIMENSIONS` values. It answers null when no embedder is configured
 * or it cannot be reached, so a caller falls back to keywords; it never throws for an outage. An object, not a bare function, so
 * a unit spec doubles it with `mock<McpEmbedder>()`. When the ai-router `local` provider lands, its adapter replaces the Ollama one.
 */
export interface McpEmbedder {
    /** Whether an embedder is configured at all (false means keyword search only). */
    readonly isConfigured: boolean
    /** One vector per text in order, or null when the embedder is off or unreachable. */
    embed(texts: ReadonlyArray<string>): Promise<ReadonlyArray<ReadonlyArray<number>> | null>
}

/** Token of the port that embeds texts. */
export const MCP_EMBEDDER: unique symbol = Symbol("domain.mcp.embedder")

/** Injects the port that embeds texts. Parameter type: McpEmbedder. */
export const InjectMcpEmbedder = (): TypedParameterDecorator<McpEmbedder> => injector<McpEmbedder>(MCP_EMBEDDER)
