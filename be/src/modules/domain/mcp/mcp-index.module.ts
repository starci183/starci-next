import { Module, type DynamicModule } from "@nestjs/common"
import { QdrantModule } from "@modules/integrations/qdrant"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./mcp-index.module-definition"
import { MCP_EMBEDDER } from "./mcp-embedder.port"
import { McpHarnessStoreSource } from "./mcp-harness-store.source"
import { MCP_HARNESS_SOURCE } from "./mcp-harness-source.port"
import { LessonSourceService } from "@modules/domain/lesson"
import { McpHarnessService } from "./mcp-harness.service"
import { McpLessonIndexService } from "./mcp-lesson-index.service"
import { MCP_SOURCE_TREE } from "./mcp-source-tree.port"
import { McpSourceService } from "./mcp-source.service"
import { MCP_PAYLOAD_INDEXES, McpQdrantVectorStore } from "./mcp-qdrant.vector-store"
import { McpRouterEmbedder } from "./mcp-router.embedder"
import { McpUnconfiguredVectorStore } from "./mcp-unconfigured.vector-store"
import { McpVectorIndex } from "./mcp-vector.index"
import { MCP_VECTOR_STORE } from "./mcp-vector-store.port"

@Module({})
/**
 * The semantic index of the mcp capability: the embedder port (the ai-router local provider), the vector store port (Postgres
 * point rows and Qdrant points, or the unconfigured store when no Qdrant is declared), the index that embeds only new content
 * hashes, the harness guides and docs, the lesson source reader and the batch jobs of the harness and of the lessons. It needs the
 * clock, the http client, the primary database and the lesson capability (the lesson read and the source tree), so the command
 * line composes it without the relay.
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
                McpSourceService,
                McpLessonIndexService,
                { provide: MCP_SOURCE_TREE, useExisting: LessonSourceService },
                { provide: MCP_EMBEDDER, useClass: McpRouterEmbedder },
                {
                    provide: MCP_VECTOR_STORE,
                    useClass: qdrant === null ? McpUnconfiguredVectorStore : McpQdrantVectorStore,
                },
                { provide: MCP_HARNESS_SOURCE, useClass: McpHarnessStoreSource },
            ],
            exports: [McpVectorIndex, McpHarnessService, McpSourceService, McpLessonIndexService],
        }
    }
}
