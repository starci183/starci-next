import { Module, type DynamicModule } from "@nestjs/common"
import { QdrantModule } from "@modules/integrations/qdrant"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./mcp-index.module-definition"
import { MCP_EMBEDDER } from "./mcp-embedder.port"
import { McpHarnessDiskSource } from "./mcp-harness-disk.source"
import { MCP_HARNESS_SOURCE } from "./mcp-harness-source.port"
import { McpHarnessService } from "./mcp-harness.service"
import { MCP_PAYLOAD_INDEXES, McpQdrantVectorStore } from "./mcp-qdrant.vector-store"
import { McpRouterEmbedder } from "./mcp-router.embedder"
import { McpUnconfiguredVectorStore } from "./mcp-unconfigured.vector-store"
import { McpVectorIndex } from "./mcp-vector.index"
import { MCP_VECTOR_STORE } from "./mcp-vector-store.port"

@Module({})
/**
 * The semantic index of the mcp capability: the embedder port (the ai-router local provider), the vector store port (Postgres
 * point rows and Qdrant points, or the unconfigured store when no Qdrant is declared), the index that embeds only new content
 * hashes, and the harness guides and docs with their batch job. It needs only the clock, the http client and the primary
 * database, so the command line composes it without the relay or the lessons.
 */
export class McpIndexModule extends ConfigurableModuleClass {
    /** Registers the index services behind their ports. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        const qdrant = options.qdrant
        return {
            ...base,
            imports: [
                ...(base.imports ?? []),
                ...(qdrant === null
                    ? []
                    : [QdrantModule.register({ isGlobal: false, ...qdrant, payloadIndexes: MCP_PAYLOAD_INDEXES })]),
            ],
            providers: [
                ...(base.providers ?? []),
                McpVectorIndex,
                McpHarnessService,
                { provide: MCP_EMBEDDER, useClass: McpRouterEmbedder },
                {
                    provide: MCP_VECTOR_STORE,
                    useClass: qdrant === null ? McpUnconfiguredVectorStore : McpQdrantVectorStore,
                },
                { provide: MCP_HARNESS_SOURCE, useClass: McpHarnessDiskSource },
            ],
            exports: [McpVectorIndex, McpHarnessService],
        }
    }
}
