import { Module, type DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./mcp.module-definition"
import { MCP_EMBEDDER } from "./mcp-embedder.port"
import { McpOllamaEmbedder } from "./mcp-ollama.embedder"
import { McpServerFactory } from "./mcp-server.factory"
import { McpSourceService } from "./mcp-source.service"
import { McpTokenService } from "./mcp-token.service"
import { McpTutorService } from "./mcp-tutor.service"
import { McpVectorIndex } from "./mcp-vector.index"

@Module({})
/**
 * The mcp capability: the learner's personal access tokens, the lesson companion the learner's AI reads and acts through
 * (lesson text through the app's own gating, the pinned source, scenarios, the learner's own runs and one confirmed run
 * request) and the semantic search over what the learner may read. The app that composes it also composes the lesson,
 * entitlement and relay capabilities.
 */
export class McpModule extends ConfigurableModuleClass {
    /** Registers the services; the embedder is the local Ollama adapter until the ai-router `local` provider replaces it. */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            providers: [
                ...(base.providers ?? []),
                McpTokenService,
                McpSourceService,
                McpVectorIndex,
                McpTutorService,
                McpServerFactory,
                { provide: MCP_EMBEDDER, useClass: McpOllamaEmbedder },
            ],
            exports: [McpTokenService, McpTutorService, McpServerFactory],
        }
    }
}
