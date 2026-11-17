/** Events the mcp capability records; fields are counts and scope names, never a text. */
export enum McpLogEvent {
    /** One corpus of the semantic index was synced: how many chunks it holds, embedded, reused and pruned. */
    Reindexed = "mcp.reindexed",
    /** The batch job could not embed: the embedder or the vector store is off or unreachable. */
    ReindexSkipped = "mcp.reindex-skipped",
    /** A lesson ships no source tree, so only its text was indexed. */
    ReindexNoSource = "mcp.reindex-no-source",
}
