/** One access token row as the mcp queries return it. */
export interface McpTokenRow {
    /** Token id. */
    token_id: string
    /** The learner. */
    learner_id: string
    /** The learner's name for it. */
    name: string
    /** The last four characters of the secret. */
    hint: string
    /** Creation instant. */
    created_at: Date
    /** Last use, or null. */
    last_used_at: Date | null
}
