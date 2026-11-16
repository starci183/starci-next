import type { EnvSource } from "@modules/platform/config"
import type { McpOptions } from "./mcp.options"

/** The default number of access tokens one learner holds. */
const TOKEN_LIMIT = 5
/** The default local embedding model. */
const EMBED_MODEL = "qwen3-embedding:8b"

/**
 * Reads the mcp tunables: `MCP_TOKEN_LIMIT` (default 5), `MCP_SOURCE_ROOT` (the folder of lesson checkouts, optional),
 * `MCP_PUBLIC_URL` (the address learners paste into Claude or ChatGPT, optional), and the local embedder: `MCP_EMBED_URL`
 * (for example http://localhost:11434; semantic search is off when it is unset) with `MCP_EMBED_MODEL`.
 */
export const parseMcpConfig = (env: EnvSource): Omit<McpOptions, "isGlobal"> => ({
    tokenLimit: env.int("MCP_TOKEN_LIMIT", TOKEN_LIMIT),
    sourceRoot: env.optional("MCP_SOURCE_ROOT") ?? null,
    publicUrl: env.optional("MCP_PUBLIC_URL") ?? null,
    embed: env.has("MCP_EMBED_URL")
        ? { url: env.url("MCP_EMBED_URL"), model: env.optional("MCP_EMBED_MODEL") ?? EMBED_MODEL }
        : null,
})
