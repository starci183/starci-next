/** The local embedder semantic search asks: Ollama's address and model. */
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
}
