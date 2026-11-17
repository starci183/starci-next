import { CommandRunner, SubCommand } from "nest-commander"
import { McpHarnessService, McpLessonIndexService, McpLogEvent } from "@modules/domain/mcp"
import { InjectLogger, type Logger } from "@modules/platform/logging"

@SubCommand({
    name: "reindex",
    description:
        "Embed the harness guides and docs, every live lesson (both locales) and its source that changed since the last run (by content hash) and drop what is gone",
})
/**
 * `cli mcp reindex`: the batch job of the semantic index. It reads the harness guides and docs the seed loader stored, then every
 * live lesson (its documents in both locales and its source by file and symbol), embeds only the chunks whose content hash is not
 * stored, deletes the stored chunks no document holds any more and records one info event per corpus. With no embedder declared
 * nothing is embedded and search stays on keywords.
 */
export class ReindexMcpCli extends CommandRunner {
    constructor(
        private readonly harness: McpHarnessService,
        private readonly lessons: McpLessonIndexService,
        @InjectLogger() private readonly logger: Logger,
    ) {
        super()
    }

    /** Runs the job and records what each corpus embedded, reused and pruned. */
    async run(): Promise<void> {
        const report = await this.harness.reindex()
        const lessons = await this.lessons.reindex()
        for (const scope of [...report.scopes, ...lessons.scopes]) this.logger.info(McpLogEvent.Reindexed, { ...scope })
        if (report.scopes.length + lessons.scopes.length === 0)
            this.logger.warn(McpLogEvent.ReindexSkipped, { documents: report.documents, lessons: lessons.lessons })
        if (lessons.withoutSource.length > 0)
            this.logger.info(McpLogEvent.ReindexNoSource, { lessons: lessons.withoutSource.join(",") })
    }
}
