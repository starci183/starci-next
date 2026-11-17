import { Injectable } from "@nestjs/common"
import { LessonReadService } from "@modules/domain/lesson"
import { McpError, McpErrorCode } from "./errors/mcp.error"
import { lessonChunksWithAccessOf, lessonDocsOf } from "./mcp-lesson.policy"
import { McpSourceService } from "./mcp-source.service"
import { McpVectorIndex, type McpSyncReport } from "./mcp-vector.index"

/** The two locales every lesson is written in; each is its own scope of the index. */
const LESSON_LOCALES: ReadonlyArray<"vi" | "en"> = ["vi", "en"]

/** The result of the batch job for every live lesson. */
export interface McpLessonReindexReport {
    /** The live lessons visited. */
    readonly lessons: number
    /** One report per lesson and locale (the text) and per lesson (the code); a corpus whose embedder or store was unreachable is absent. */
    readonly scopes: ReadonlyArray<McpSyncReport>
    /** The lessons that ship no source tree, whose code was not indexed. */
    readonly withoutSource: ReadonlyArray<string>
}

@Injectable()
/**
 * The batch job of the lesson corpora: for every live lesson, both locales of its documents (each tagged `free` when the free
 * reader's view holds the same document, `premium` otherwise) and its source by file and symbol. Only chunks whose content hash is
 * new are embedded, and the chunks no document holds any more are dropped. It reads the same projections the learner reads
 * (`LessonReadService.read`, the source tree), so nothing a learner may not read is ever embedded.
 */
export class McpLessonIndexService {
    constructor(
        private readonly lessons: LessonReadService,
        private readonly source: McpSourceService,
        private readonly vectors: McpVectorIndex,
    ) {}

    /** Syncs every live lesson; a lesson without a source tree only has its text indexed. */
    async reindex(): Promise<McpLessonReindexReport> {
        const catalog = await this.lessons.catalog({
            locale: "vi",
            group: null,
            topic: null,
            category: null,
            difficulty: null,
            language: null,
            provider: null,
            q: null,
        })
        const scopes: Array<McpSyncReport> = []
        const withoutSource: Array<string> = []
        for (const { id } of catalog) {
            for (const locale of LESSON_LOCALES) {
                const all = lessonDocsOf(await this.lessons.read({ id, locale, isPremium: true }))
                const open = lessonDocsOf(await this.lessons.read({ id, locale, isPremium: false }))
                const report = await this.vectors.sync(
                    {
                        scope: { kind: "lesson", sourceId: id, locale },
                        access: "premium",
                        readable: ["free", "premium"],
                    },
                    lessonChunksWithAccessOf(id, all, open),
                    true,
                )
                if (report !== null) scopes.push(report)
            }
            try {
                const report = await this.vectors.sync(
                    { scope: { kind: "code", sourceId: id, locale: "und" }, access: "premium", readable: ["premium"] },
                    await this.source.chunks(id),
                    true,
                )
                if (report !== null) scopes.push(report)
            } catch (cause) {
                if (!(cause instanceof McpError) || cause.code !== McpErrorCode.SourceUnavailable) throw cause
                withoutSource.push(id)
            }
        }
        return { lessons: catalog.length, scopes, withoutSource }
    }
}
