import { createHash } from "node:crypto"
import { access, readFile, readdir } from "node:fs/promises"
import { join } from "node:path"
import type { PracticeSourceEntry, PracticeSourceFile } from "./practice.contracts"
import type { PracticeSourceReader } from "./practice-source.port"

/** The files of a problem folder the importer reads; the audit notes under `.e2e` are not content. */
const PROBLEM_FILES: ReadonlyArray<string> = ["en.md", "vi.md"]

const folders = async (directory: string): Promise<ReadonlyArray<string>> =>
    (await readdir(directory, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b))

const exists = (path: string): Promise<boolean> =>
    access(path).then(
        () => true,
        () => false,
    )

const entriesOf = async (sets: string, pattern: string): Promise<ReadonlyArray<PracticeSourceEntry>> => {
    const problems = join(sets, pattern, "problems")
    if (!(await exists(problems))) return []
    return (await folders(problems)).map((slug) => ({ pattern, slug }))
}

const entries = async (directory: string): Promise<ReadonlyArray<PracticeSourceEntry>> => {
    const sets = join(directory, "sets")
    const groups = await Promise.all((await folders(sets)).map((pattern) => entriesOf(sets, pattern)))
    return groups.flat()
}

const fileOf = async (root: string, name: string): Promise<ReadonlyArray<PracticeSourceFile>> => {
    if (!(await exists(join(root, name)))) return []
    const bytes = await readFile(join(root, name))
    return [{ path: name, text: bytes.toString("utf8"), sha256: createHash("sha256").update(bytes).digest("hex") }]
}

const read = async (directory: string, entry: PracticeSourceEntry): Promise<ReadonlyArray<PracticeSourceFile>> => {
    const root = join(directory, "sets", entry.pattern, "problems", entry.slug)
    const files = await Promise.all(PROBLEM_FILES.map((name) => fileOf(root, name)))
    return files.flat()
}

/** Reads problem folders from the local disk: the folder list, and the two locale files of a folder with the SHA-256 of their raw bytes. */
export const practiceDirectory: PracticeSourceReader = { entries, read }
