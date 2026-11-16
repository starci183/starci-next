import { access, readFile, readdir } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import type { HarnessRawFile } from "./harness.contracts"
import type { HarnessSourceReader } from "./harness-source.port"

/** Folders the raw tree never ships. */
const SKIPPED: ReadonlySet<string> = new Set(["node_modules", ".git"])

const ROOT = ["raw", "harness"]

const exists = (directory: string): Promise<boolean> =>
    access(join(directory, ...ROOT)).then(
        () => true,
        () => false,
    )

const read = async (directory: string): Promise<ReadonlyArray<HarnessRawFile>> => {
    const root = join(directory, ...ROOT)
    const entries = await readdir(root, { recursive: true, withFileTypes: true })
    const files = await Promise.all(
        entries
            .filter((entry) => entry.isFile())
            .filter(
                (entry) =>
                    !relative(root, entry.parentPath)
                        .split(sep)
                        .some((part) => SKIPPED.has(part)),
            )
            .map(async (entry): Promise<HarnessRawFile | null> => {
                const bytes = await readFile(join(entry.parentPath, entry.name))
                if (bytes.includes(0)) return null
                const path = relative(directory, join(entry.parentPath, entry.name)).split(sep).join("/")
                return { path, text: bytes.toString("utf8") }
            }),
    )
    return files.filter((file): file is HarnessRawFile => file !== null).sort((a, b) => a.path.localeCompare(b.path))
}

/** Reads the raw harness tree from the local disk; a file with a NUL byte is binary and is left out. */
export const harnessDirectory: HarnessSourceReader = { read, exists }
