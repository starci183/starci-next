import { readFile, readdir } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import { Injectable } from "@nestjs/common"
import type { McpHarnessFile } from "./mcp-harness.policy"
import type { McpHarnessSource } from "./mcp-harness-source.port"
import { InjectMcpIndexOptions } from "./mcp-index.decorators"
import type { McpIndexOptions } from "./mcp-index.options"

/** The folders of the content checkout that may hold the harness guides and docs, authoring layout first. */
const ROOTS: ReadonlyArray<string> = ["raw/harness", "harness"]
/** The sub-folders read under a harness root: nothing else of the harness is listed. */
const PARTS: ReadonlyArray<string> = ["guides", "docs"]

@Injectable()
/** Reads the harness guides and docs from a content checkout on disk (`MCP_HARNESS_DIR`); empty when none is declared. */
export class McpHarnessDiskSource implements McpHarnessSource {
    constructor(@InjectMcpIndexOptions() private readonly options: McpIndexOptions) {}

    /** Every `.md` file under `<dir>/{raw/harness,harness}/{guides,docs}`; a missing folder is skipped. */
    async files(): Promise<ReadonlyArray<McpHarnessFile>> {
        const dir = this.options.harnessDir
        if (dir === null) return []
        const found: Array<McpHarnessFile> = []
        for (const root of ROOTS)
            for (const part of PARTS) {
                const base = join(dir, root, part)
                const entries = await readdir(base, { recursive: true, withFileTypes: true }).catch(() => [])
                for (const entry of entries) {
                    if (!entry.isFile() || !entry.name.endsWith(".md")) continue
                    const full = join(entry.parentPath, entry.name)
                    found.push({
                        path: relative(dir, full).split(sep).join("/"),
                        text: await readFile(full, "utf8"),
                    })
                }
            }
        return found
    }
}
