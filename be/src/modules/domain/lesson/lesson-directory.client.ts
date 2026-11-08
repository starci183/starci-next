import { createHash } from "node:crypto"
import { access, readFile, readdir } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import type { LessonSourceReader } from "./lesson-source.port"
import type { LessonSourceFile } from "./lesson-import.contracts"
import { parseSeparatorFields } from "./separator.policy"
import type { LessonTopicModule, LessonTopicStep } from "./lesson-topic.contracts"

const folders = async (directory: string): Promise<ReadonlyArray<string>> =>
    (await readdir(directory, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b))

const sourceFileOf = async (root: string, full: string): Promise<LessonSourceFile> => {
    const bytes = await readFile(full)
    return {
        path: relative(root, full).split(sep).join("/"),
        text: bytes.toString("utf8"),
        sha256: createHash("sha256").update(bytes).digest("hex"),
    }
}

const read = async (directory: string, folder: string): Promise<ReadonlyArray<LessonSourceFile>> => {
    const root = join(directory, folder)
    const entries = await readdir(root, { recursive: true, withFileTypes: true })
    const files = await Promise.all(
        entries
            .filter((entry) => entry.isFile())
            .map((entry) => sourceFileOf(root, join(entry.parentPath, entry.name))),
    )
    return files.sort((a, b) => a.path.localeCompare(b.path))
}

const orderOf = (name: string): number => Number.parseInt(name, 10)

const byOrder = (a: string, b: string): number => orderOf(a) - orderOf(b) || a.localeCompare(b)

const subfolders = async (directory: string): Promise<Array<string>> =>
    (await folders(directory)).filter((name) => /^\d+-/u.test(name)).sort(byOrder)

const titleOf = async (file: string, fallback: string): Promise<string> => {
    const present = await access(file).then(
        () => true,
        () => false,
    )
    return present ? (parseSeparatorFields(await readFile(file, "utf8")).fields["title"] ?? fallback) : fallback
}

const modules = async (directory: string, source: LessonTopicModule): Promise<ReadonlyArray<LessonTopicStep>> => {
    const modulesDirectory = join(directory, "..", "courses", source.course, "modules")
    const found = (await access(modulesDirectory).then(
        () => true,
        () => false,
    ))
        ? (await subfolders(modulesDirectory)).find((name) => orderOf(name) === source.index)
        : undefined
    if (found === undefined) return []
    const contents = join(modulesDirectory, found, "contents")
    const names = await subfolders(contents)
    return Promise.all(
        names.map(async (name, position) => ({
            order: position + 1,
            key: `courses/${source.course}/modules/${found}/contents/${name}`,
            titles: {
                vi: await titleOf(join(contents, name, "vi.md"), name),
                en: await titleOf(join(contents, name, "en.md"), name),
            },
        })),
    )
}

/** Reads concept folders from the local disk: the folder list, and every file with the SHA-256 of its raw bytes. */
export const lessonDirectory: LessonSourceReader = { folders, read, modules }
