import { Injectable } from "@nestjs/common"
import type { McpVectorStore } from "./mcp-vector-store.port"

/** The failure every call of the unconfigured store answers; the index turns it into a keyword fallback. */
const OFF = (): Promise<never> => Promise.reject(new Error("no vector store is declared (QDRANT_URL)"))

@Injectable()
/** The store of an app that declares no Qdrant: semantic search is off, keywords answer, and nothing is written. */
export class McpUnconfiguredVectorStore implements McpVectorStore {
    readonly isConfigured = false
    known = OFF
    put = OFF
    retag = OFF
    nearest = OFF
    prune = OFF
}
