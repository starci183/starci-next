import { Injectable } from "@nestjs/common"
import type { LessonSourceTree } from "@modules/domain/lesson"
import { McpError, McpErrorCode } from "./errors/mcp.error"
import { InjectMcpSourceTree, type McpSourceTree } from "./mcp-source-tree.port"
import type { McpCatalog, McpFile, McpSearchHit } from "./mcp.contracts"
import {
    FILE_BYTES_MAX,
    HITS_MAX,
    catalogOf,
    fileOf,
    hitTextOf,
    isBinary,
    readablePathOf,
    skippedDirectory,
} from "./mcp-source.policy"

/** A lesson id as the tree is asked for it: a slug, never a path. */
const LESSON_ID = /^[a-z0-9][a-z0-9-]{0,99}$/u
/** The most files a search visits, so a huge tree cannot stall a call. */
const FILES_MAX = 3000

/** One readable file of the lesson source: its path and text. */
export interface SourceText {
    readonly path: string
    readonly text: string
}

@Injectable()
/**
 * Reads the lesson source from the source tree of the live lesson version, pinned to its content commit. Every read, listing
 * and search passes `readablePathOf` and the size and binary checks on top of a tree that holds only `source/`, so a hidden test,
 * a rubric, a submission, a mutant or a key is never opened, listed or searched.
 */
export class McpSourceService {
    constructor(@InjectMcpSourceTree() private readonly trees: McpSourceTree) {}

    /** The public catalog of a lesson; MCP_SOURCE_UNAVAILABLE when it ships no source tree. */
    async catalog(lessonId: string): Promise<McpCatalog> {
        return catalogOf(lessonId, await this.treeOf(lessonId))
    }

    /** The asked lines of one file; a path that is not readable is MCP_PATH_FORBIDDEN, a missing file MCP_FILE_NOT_FOUND. */
    async read(lessonId: string, path: string, from?: number, to?: number): Promise<McpFile> {
        const tree = await this.treeOf(lessonId)
        const safe = readablePathOf(path)
        if (safe === null) throw new McpError({ code: McpErrorCode.PathForbidden })
        const file = tree.files.find((item) => item.path === safe)
        if (file === undefined || !this.readable(file.text)) throw new McpError({ code: McpErrorCode.FileNotFound })
        return fileOf(safe, tree.commit, file.text, from, to)
    }

    /** Every readable text file of the source, in path order, bounded in count and size. */
    async texts(lessonId: string): Promise<ReadonlyArray<SourceText>> {
        const tree = await this.treeOf(lessonId)
        return tree.files
            .filter(
                (file) =>
                    readablePathOf(file.path) !== null &&
                    !file.path.split("/").some((segment) => skippedDirectory(segment)) &&
                    this.readable(file.text),
            )
            .slice(0, FILES_MAX)
            .map((file) => ({ path: file.path, text: file.text }))
    }

    /** A literal, case-insensitive keyword search: every term must appear on the line; hits in file order. */
    async keywordSearch(lessonId: string, query: string): Promise<ReadonlyArray<McpSearchHit>> {
        const terms = query
            .toLowerCase()
            .split(/\s+/u)
            .filter((term) => term.length > 0)
            .slice(0, 8)
        if (terms.length === 0) return []
        const hits: Array<McpSearchHit> = []
        for (const file of await this.texts(lessonId)) {
            const lines = file.text.split(/\r?\n/u)
            for (let index = 0; index < lines.length && hits.length < HITS_MAX; index += 1) {
                const line = lines[index] ?? ""
                const lower = line.toLowerCase()
                if (terms.every((term) => lower.includes(term)))
                    hits.push({ path: file.path, line: index + 1, text: hitTextOf(line) })
            }
            if (hits.length >= HITS_MAX) break
        }
        return hits
    }

    private async treeOf(lessonId: string): Promise<LessonSourceTree> {
        const tree = LESSON_ID.test(lessonId) ? await this.trees.tree(lessonId) : null
        if (tree === null) throw new McpError({ code: McpErrorCode.SourceUnavailable })
        return tree
    }

    /** True for a text file of a size the AI reads. */
    private readable(text: string): boolean {
        return text.length <= FILE_BYTES_MAX && !isBinary(Buffer.from(text.slice(0, 4096)))
    }
}
