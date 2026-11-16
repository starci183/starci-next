import { Injectable } from "@nestjs/common"
import { open, readFile, readdir, realpath } from "node:fs/promises"
import { join, sep } from "node:path"
import { McpError, McpErrorCode } from "./errors/mcp.error"
import { InjectMcpOptions } from "./mcp.decorators"
import type { McpOptions } from "./mcp.options"
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

/** A lesson id as a folder name: a slug, never a path. */
const LESSON_FOLDER = /^[a-z0-9][a-z0-9-]{0,99}$/u
/** The most files a walk visits, so a huge checkout cannot stall a call. */
const FILES_MAX = 3000

/** One readable file of the repository: its path and text. */
export interface SourceText {
    readonly path: string
    readonly text: string
}

@Injectable()
/**
 * Reads the lesson repository from a checkout on disk at `<MCP_SOURCE_ROOT>/<lessonId>/repo/`, pinned to the commit its
 * `starci-source.json` names. Every read passes `readablePathOf` and a real-path check, so a `..`, a symlink, a hidden test, a
 * rubric, a submission, a mutant or a key is never opened, listed or searched.
 */
export class McpSourceService {
    constructor(@InjectMcpOptions() private readonly options: McpOptions) {}

    /** The public catalog of a lesson checkout; MCP_SOURCE_UNAVAILABLE when this instance serves none for it. */
    async catalog(lessonId: string): Promise<McpCatalog> {
        const root = this.lessonRoot(lessonId)
        const raw = await readFile(join(root, "starci-source.json"), "utf8").catch(() => null)
        const catalog = raw === null ? null : catalogOf(lessonId, this.parse(raw))
        if (catalog === null) throw new McpError({ code: McpErrorCode.SourceUnavailable })
        return catalog
    }

    /** The asked lines of one file; a path that is not readable is MCP_PATH_FORBIDDEN, a missing file MCP_FILE_NOT_FOUND. */
    async read(lessonId: string, path: string, from?: number, to?: number): Promise<McpFile> {
        const catalog = await this.catalog(lessonId)
        const safe = readablePathOf(path, catalog.deny)
        if (safe === null) throw new McpError({ code: McpErrorCode.PathForbidden })
        const text = await this.textOf(join(this.lessonRoot(lessonId), "repo"), safe)
        if (text === null) throw new McpError({ code: McpErrorCode.FileNotFound })
        return fileOf(safe, catalog.commit, text, from, to)
    }

    /** Every readable text file of the repository, in path order, bounded in count and size. */
    async texts(lessonId: string): Promise<ReadonlyArray<SourceText>> {
        const catalog = await this.catalog(lessonId)
        const repo = join(this.lessonRoot(lessonId), "repo")
        const found: Array<SourceText> = []
        const walk = async (relative: string): Promise<void> => {
            const entries = await readdir(join(repo, relative), { withFileTypes: true }).catch(() => [])
            for (const entry of [...entries].sort((a, b) => a.name.localeCompare(b.name))) {
                if (found.length >= FILES_MAX) return
                const path = relative === "" ? entry.name : `${relative}/${entry.name}`
                if (entry.isDirectory()) {
                    if (!skippedDirectory(entry.name) && readablePathOf(path, catalog.deny) !== null) await walk(path)
                } else if (entry.isFile() && readablePathOf(path, catalog.deny) !== null) {
                    const text = await this.textOf(repo, path)
                    if (text !== null) found.push({ path, text })
                }
            }
        }
        await walk("")
        return found
    }

    /** A literal, case-insensitive keyword search: every term must appear on the line; hits best-first by file order. */
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

    private parse(raw: string): unknown {
        try {
            return JSON.parse(raw)
        } catch {
            return null
        }
    }

    private lessonRoot(lessonId: string): string {
        const root = this.options.sourceRoot
        if (root === null || !LESSON_FOLDER.test(lessonId)) throw new McpError({ code: McpErrorCode.SourceUnavailable })
        return join(root, lessonId)
    }

    /** The text of a file inside the repository, or null when it is missing, binary, too large, or resolves outside it. */
    private async textOf(repo: string, path: string): Promise<string | null> {
        const full = join(repo, ...path.split("/"))
        const real = await realpath(full).catch(() => null)
        const realRepo = await realpath(repo).catch(() => null)
        if (real === null || realRepo === null || !real.startsWith(realRepo + sep)) return null
        const handle = await open(real, "r").catch(() => null)
        if (handle === null) return null
        try {
            const stat = await handle.stat()
            if (!stat.isFile() || stat.size > FILE_BYTES_MAX) return null
            const buffer = Buffer.alloc(stat.size)
            await handle.read(buffer, 0, stat.size, 0)
            return isBinary(buffer.subarray(0, 4096)) ? null : buffer.toString("utf8")
        } finally {
            await handle.close()
        }
    }
}
