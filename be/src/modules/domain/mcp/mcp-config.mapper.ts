import type { EnvSource } from "@modules/platform/config"
import { parseQdrantConfig } from "@modules/integrations/qdrant"
import type { McpOptions } from "./mcp.options"

/** The default number of access tokens one learner holds. */
const TOKEN_LIMIT = 5
/** The default local embedding model. */
const EMBED_MODEL = "qwen3-embedding:8b"

/**
 * Reads the mcp tunables: `MCP_TOKEN_LIMIT` (default 5),
 * `MCP_PUBLIC_URL` (the address learners paste into Claude or ChatGPT, optional), the local embedder: `MCP_EMBED_URL`
 * (the OpenAI-compatible address, `https://embed.starci.org/v1` for the shared host service; semantic search is off when it is
 * unset) with `AI_API_KEY` (its token, sealed, optional for a keyless server) and `MCP_EMBED_MODEL`, and the
 * Qdrant service (`QDRANT_URL` with `QDRANT_VECTOR_SIZE`, see `parseQdrantConfig`; with none, semantic search is off).
 */
export const parseMcpConfig = (env: EnvSource): Omit<McpOptions, "isGlobal"> => ({
    tokenLimit: env.int("MCP_TOKEN_LIMIT", TOKEN_LIMIT),
    publicUrl: env.optional("MCP_PUBLIC_URL") ?? null,
    embed: env.has("MCP_EMBED_URL")
        ? {
              url: env.url("MCP_EMBED_URL"),
              apiKey: env.has("AI_API_KEY") ? env.secret("AI_API_KEY") : null,
              model: env.optional("MCP_EMBED_MODEL") ?? EMBED_MODEL,
          }
        : null,
    qdrant: parseQdrantConfig(env),
})
