import { Module, type DynamicModule } from "@nestjs/common"
import { ConfigurableModuleClass, OPTIONS_TYPE } from "./mcp.module-definition"
import { LessonSourceService } from "@modules/domain/lesson"
import { MCP_SOURCE_TREE } from "./mcp-source-tree.port"
import { McpIndexModule } from "./mcp-index.module"
import { McpServerFactory } from "./mcp-server.factory"
import { McpSourceService } from "./mcp-source.service"
import { McpTokenService } from "./mcp-token.service"
import { McpTutorService } from "./mcp-tutor.service"

@Module({})
/**
 * The mcp capability: the learner's personal access tokens, the lesson companion the learner's AI reads and acts through
 * (lesson text through the app's own gating, the pinned source, scenarios, the learner's own runs and one confirmed run
 * request), the semantic search over what the learner may read and the free harness search. The app that composes it also
 * composes the lesson, entitlement and relay capabilities.
 */
export class McpModule extends ConfigurableModuleClass {
    /** Registers the services and the semantic index (pgvector store, local embedder, harness content). */
    static register(options: typeof OPTIONS_TYPE): DynamicModule {
        const base = super.register(options)
        return {
            ...base,
            imports: [
                ...(base.imports ?? []),
                McpIndexModule.register({
                    embed: options.embed,
                    harnessDir: options.harnessDir,
                    qdrant: options.qdrant,
                }),
            ],
            providers: [
                ...(base.providers ?? []),
                McpTokenService,
                McpSourceService,
                McpTutorService,
                McpServerFactory,
                { provide: MCP_SOURCE_TREE, useExisting: LessonSourceService },
            ],
            exports: [McpTokenService, McpTutorService, McpServerFactory],
        }
    }
}
