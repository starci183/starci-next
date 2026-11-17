import { Logger } from "@nestjs/common"
import { CommandRunner, SubCommand } from "nest-commander"
import { McpHarnessService, McpLessonIndexService } from "@modules/domain/mcp"

@SubCommand({
    name: "reindex",
    description:
        "Embed the harness guides and docs, every live lesson (both locales) and its source that changed since the last run (by content hash) and drop what is gone",
})
/**
 * `cli mcp reindex`: the batch job of the semantic index. It reads the harness guides and docs of `MCP_HARNESS_DIR`, then every live lesson (its documents in both locales and its source by file and symbol), embeds only
 * the chunks whose content hash is not stored, deletes the stored chunks no document holds any more and logs one line per locale.
 * With no embedder declared nothing is embedded and search stays on keywords.
 */
export class ReindexMcpCli extends CommandRunner {
    private readonly logger = new Logger(ReindexMcpCli.name)

    constructor(
        private readonly harness: McpHarnessService,
        private readonly lessons: McpLessonIndexService,
    ) {
        super()
    }

    /** Runs the job and logs what it embedded, reused and pruned. */
    async run(): Promise<void> {
        const report = await this.harness.reindex()
        if (report.scopes.length === 0)
            this.logger.warn(
                `mcp reindex: ${report.documents} documents, nothing embedded (embedder off or unreachable)`,
            )
        const lessons = await this.lessons.reindex()
        if (lessons.lessons > 0 && lessons.scopes.length === 0)
            this.logger.warn(`mcp reindex: ${lessons.lessons} lessons, nothing embedded (embedder off or unreachable)`)
        for (const scope of [...report.scopes, ...lessons.scopes])
            this.logger.log(
                `mcp reindex ${scope.scope}: ${scope.chunks} chunks, ${scope.embedded} embedded, ${scope.reused} reused, ${scope.pruned} pruned`,
            )
        if (lessons.withoutSource.length > 0)
            this.logger.log(`mcp reindex: no source tree for ${lessons.withoutSource.join(", ")}`)
    }
}
