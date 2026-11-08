import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { dirname, join, relative, sep } from "node:path"
import type { ContentDiskReader } from "./content-disk.port"

const exists = (path: string): Promise<boolean> =>
    access(path).then(
        () => true,
        () => false,
    )

const folders = async (path: string): Promise<ReadonlyArray<string>> =>
    (await exists(path))
        ? (await readdir(path, { withFileTypes: true }))
              .filter((entry) => entry.isDirectory())
              .map((entry) => entry.name)
              .sort((a, b) => a.localeCompare(b))
        : []

const files = async (root: string): Promise<ReadonlyArray<string>> =>
    (await exists(root))
        ? (await readdir(root, { recursive: true, withFileTypes: true }))
              .filter((entry) => entry.isFile())
              .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join("/"))
              .filter((path) => !path.startsWith(".git/"))
              .sort((a, b) => a.localeCompare(b))
        : []

const text = (path: string): Promise<string> => readFile(path, "utf8")

const writeJson = async (path: string, value: unknown): Promise<void> => {
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

/** Looks at a content checkout on the local disk. */
export const contentDisk: ContentDiskReader = { exists, folders, files, text, writeJson }
