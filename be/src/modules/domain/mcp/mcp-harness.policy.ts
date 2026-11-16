import type { McpCorpus } from "./mcp-vector.index"
import { FILE_BYTES_MAX, isBinary, readablePathOf } from "./mcp-source.policy"

/** The two locales the harness content is written in. */
export const HARNESS_LOCALES: ReadonlyArray<"vi" | "en"> = ["vi", "en"]

/** One markdown file the harness index may read, named relative to the content checkout. */
export interface McpHarnessFile {
    /** The path under the content checkout, for example `raw/harness/guides/claude/hooks/vi.md`. */
    readonly path: string
    /** The text. */
    readonly text: string
}

/** One document of the harness corpus: a guide or a doc in one locale. */
export interface McpHarnessDocument {
    /** `guides/<tool>/<slug>` or `docs/<slug>`: the path a hit shows. */
    readonly path: string
    /** The locale of the file. */
    readonly locale: "vi" | "en"
    /** The markdown text. */
    readonly text: string
}

/**
 * Only these parts of the harness content are ever indexed: the `vi.md` and `en.md` of a guide (`guides/<tool>/<slug>/`) and of
 * a doc (`docs/<slug>/`). The build kits (source, stages, e2e, hidden), the doctor probes and the trial traps are not here.
 * The checkout may hold the authoring layout (`raw/harness/...`) or the published one (`harness/...`).
 */
const ALLOWED = /^(?:raw\/)?harness\/((?:guides\/[a-z0-9][a-z0-9-]*\/[a-z0-9][a-z0-9-]*)|(?:docs\/[a-z0-9][a-z0-9-]*))\/(vi|en)\.md$/u

/** The document a content path names, or null for anything the index must not read (also any denied or unreadable path). */
export const harnessDocumentOf = (file: McpHarnessFile): McpHarnessDocument | null => {
    const match = ALLOWED.exec(file.path)
    const id = match?.[1]
    const locale = match?.[2]
    if (id === undefined || (locale !== "vi" && locale !== "en")) return null
    if (readablePathOf(file.path) === null) return null
    if (file.text.length > FILE_BYTES_MAX || isBinary(Buffer.from(file.text.slice(0, 4096)))) return null
    return { path: id, locale, text: file.text }
}

/** The documents of a set of files, one per allowed file (the first of a path and locale wins), in path order. */
export const harnessDocumentsOf = (files: ReadonlyArray<McpHarnessFile>): ReadonlyArray<McpHarnessDocument> => {
    const documents = new Map<string, McpHarnessDocument>()
    for (const file of files) {
        const document = harnessDocumentOf(file)
        if (document !== null && !documents.has(`${document.path}/${document.locale}`))
            documents.set(`${document.path}/${document.locale}`, document)
    }
    return [...documents.values()].sort((a, b) => a.path.localeCompare(b.path) || a.locale.localeCompare(b.locale))
}

/** The corpus of one locale of the harness: free to every learner, searched whole (it is public), kept apart by locale. */
export const harnessCorpusOf = (locale: "vi" | "en"): McpCorpus => ({
    scope: { kind: "harness", sourceId: "harness", locale },
    access: "free",
    readable: ["free"],
})
