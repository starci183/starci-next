import type { QdrantConfig } from "@modules/integrations/qdrant"
import type { McpEmbedOptions } from "./mcp.options"

/** Options of the semantic index: the local embedder and the vector store. */
export interface McpIndexOptions {
    /** Whether the index is available app-wide. */
    readonly isGlobal?: boolean
    /** The local embedder, or null when `MCP_EMBED_URL` is not declared (keywords answer). */
    readonly embed: McpEmbedOptions | null
    /** The Qdrant service, or null when `QDRANT_URL` is not declared (the unconfigured store answers, keywords follow). */
    readonly qdrant: QdrantConfig | null
}
