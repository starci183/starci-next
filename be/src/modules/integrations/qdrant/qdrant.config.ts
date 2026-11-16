import type { EnvSource } from "@modules/platform/config"
import type { QdrantConfig } from "./qdrant.options"

/** The default collection of the semantic index. */
const COLLECTION = "starci-next"

/**
 * Reads the Qdrant service from the environment: `QDRANT_URL` (declared or not: with none the vector index is off and search
 * answers by keywords) with `QDRANT_VECTOR_SIZE` (required with it: the collection is sized by the embeddings),
 * `QDRANT_API_KEY` (the one secret name, optional on a private network), `QDRANT_COLLECTION` and `QDRANT_TIMEOUT`.
 */
export const parseQdrantConfig = (env: EnvSource): QdrantConfig | null =>
    env.has("QDRANT_URL")
        ? {
              url: env.url("QDRANT_URL").replace(/\/$/u, ""),
              apiKey: env.has("QDRANT_API_KEY") ? env.secret("QDRANT_API_KEY") : null,
              timeoutMs: env.duration("QDRANT_TIMEOUT", 5000),
              collection: env.optional("QDRANT_COLLECTION") ?? COLLECTION,
              dimensions: env.int("QDRANT_VECTOR_SIZE"),
          }
        : null
