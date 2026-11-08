import { createHash } from "node:crypto"
import { access, readFile, readdir } from "node:fs/promises"
import { join, relative, sep } from "node:path"
import type { ReviewSourceDeck, ReviewSourceFile } from "./review.contracts"
import type { ReviewSourceReader } from "./review-source.port"

const folders = async (directory: string): Promise<ReadonlyArray<string>> =>
    (await readdir(directory, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

const exists = (path: string): Promise<boolean> =>
    access(path).then(
        () => true,
        () => false,
    )

const decks = async (directory: string): Promise<ReadonlyArray<ReviewSourceDeck>> => {
    const root = join(directory, "courses")
    if (!(await exists(root))) return []
    const found = await Promise.all(
        (await folders(root)).map(async (course) => {
            const base = join(root, course, "flashcard-decks")
            if (!(await exists(base))) return []
            return (await folders(base))
                .filter((folder) => /^\d+-/u.test(folder))
                .map((folder): ReviewSourceDeck => ({ deckId: `${course}/${folder}`, course, folder }))
        }),
    )
    return found.flat()
}

const read = async (directory: string, deck: ReviewSourceDeck): Promise<ReadonlyArray<ReviewSourceFile>> => {
    const root = join(directory, "courses", deck.course, "flashcard-decks", deck.folder)
    const entries = (await readdir(root, { recursive: true, withFileTypes: true })).filter((entry) => entry.isFile())
    const files = await Promise.all(
        entries.map(async (entry): Promise<ReviewSourceFile> => {
            const full = join(entry.parentPath, entry.name)
            const bytes = await readFile(full)
            return {
                path: relative(root, full).split(sep).join("/"),
                text: bytes.toString("utf8"),
                sha256: createHash("sha256").update(bytes).digest("hex"),
            }
        }),
    )
    return files.sort((a, b) => a.path.localeCompare(b.path))
}

/** Reads deck folders from the local disk: the deck list, and every file with the SHA-256 of its raw bytes. */
export const reviewDirectory: ReviewSourceReader = { decks, read }
