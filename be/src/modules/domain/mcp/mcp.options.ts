import type { QdrantConfig } from "@modules/integrations/qdrant"

/** The local embedder semantic search asks: the address of an Ollama server and its model. */
export interface McpEmbedOptions {
    /** The Ollama base address, for example `http://localhost:11434`. */
    readonly url: string
    /** The embedding model, `qwen3-embedding:8b` unless the environment names another. */
    readonly model: string
}

/** Options of the mcp capability. */
export interface McpOptions {
    /** Whether this capability is available app-wide. */
    readonly isGlobal?: boolean
    /** How many access tokens one learner may hold at once. */
    readonly tokenLimit: number
    /** The public address of the MCP endpoint the settings page shows, or null to show a relative path. */
    readonly publicUrl: string | null
    /** The local embedder, or null when `MCP_EMBED_URL` is not declared (semantic search is off, keywords answer). */
    readonly embed: McpEmbedOptions | null
    /** The content checkout whose harness guides and docs `search_harness` reads, or null when `MCP_HARNESS_DIR` is not declared. */
    readonly harnessDir: string | null
    /** The Qdrant service of the semantic index, or null when `QDRANT_URL` is not declared (keywords answer). */
    readonly qdrant: QdrantConfig | null
}
