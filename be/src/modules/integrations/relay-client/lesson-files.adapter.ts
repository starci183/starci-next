import {
    appendFileSync,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    rmdirSync,
    statSync,
    writeFileSync,
} from "node:fs"
import { dirname, join } from "node:path"
import type { HiddenFile, LastRun, LessonState } from "./lesson.contracts"
import { isRecord, jsonOf } from "./json.mapper"

/** The tarball's name inside the folder it is unpacked into; relative, so `tar` never reads a drive letter as a host. */
export const ARCHIVE_NAME = ".starci-source.tar.gz"

/** Writes the downloaded bytes into the folder, private to this user. */
export const writeArchive = (folder: string, bytes: Buffer): void => {
    writeFileSync(join(folder, ARCHIVE_NAME), bytes, { mode: 0o600 })
}

/** Removes the tarball once it is unpacked. */
export const dropArchive = (folder: string): void => {
    rmSync(join(folder, ARCHIVE_NAME), { force: true })
}

/** Keeps StarCi's own files out of the learner's git history: the lesson marker and the last-run notes. */
export const excludeFromGit = (folder: string): void => {
    excludeLines(folder, [STATE_FILE, `${LAST_DIR}/`])
}

/** Adds lines to the repository's private exclude file, so they stay out of git without touching the learner's `.gitignore`. */
export const excludeLines = (folder: string, lines: ReadonlyArray<string>): void => {
    appendFileSync(join(folder, ".git", "info", "exclude"), lines.map((line) => `${line}\n`).join(""))
}

/** Makes the folder the lesson is unpacked into. */
export const makeFolder = (path: string): void => {
    mkdirSync(path, { recursive: true })
}

/** Removes a folder the CLI made. */
export const removeFolder = (path: string): void => {
    rmSync(path, { recursive: true, force: true })
}

/** The marker `pull` leaves in the repo folder. */
export const STATE_FILE = ".starci-lesson.json"
const LAST_DIR = ".starci-last"

/** The repo folder of a lesson: the current folder when it holds the marker of that lesson, else `./<lesson>`; null when neither does. */
export const lessonRootOf = (cwd: string, lessonId: string): string | null => {
    const candidates = [cwd, join(cwd, lessonId)]
    return candidates.find((folder) => readState(folder)?.lessonId === lessonId) ?? null
}

/** The state `pull` wrote in a folder, or null. */
export const readState = (folder: string): LessonState | null => {
    const path = join(folder, STATE_FILE)
    if (!existsSync(path)) return null
    const read = jsonOf(readFileSync(path, "utf8"))
    if (read.kind !== "read" || !isRecord(read.value)) return null
    const { lessonId, commit, sha256, dir, compose, project } = read.value
    return [lessonId, commit, sha256, dir, compose, project].every((item) => typeof item === "string")
        ? ({ lessonId, commit, sha256, dir, compose, project } as LessonState)
        : null
}

/** Writes the state in the repo folder. */
export const writeState = (folder: string, state: LessonState): void => {
    writeFileSync(join(folder, STATE_FILE), `${JSON.stringify(state, null, 2)}\n`, "utf8")
}

/** True when a folder exists. */
export const hasFolder = (path: string): boolean => existsSync(path) && statSync(path).isDirectory()

/** The text of a file, or null when missing. */
export const readText = (path: string): string | null => (existsSync(path) ? readFileSync(path, "utf8") : null)

/** Removes a stale file (a report of an earlier run must not count). */
export const removeFile = (path: string): void => {
    rmSync(path, { force: true })
}

/** Saves what the last run of a scenario showed, locally in the repo folder. */
export const writeLast = (folder: string, last: LastRun): void => {
    mkdirSync(join(folder, LAST_DIR), { recursive: true })
    writeFileSync(join(folder, LAST_DIR, `${last.scenarioId}.json`), `${JSON.stringify(last, null, 2)}\n`, "utf8")
}

/** What the last run of a scenario showed, or null when there was none. */
export const readLast = (folder: string, scenarioId: string): LastRun | null => {
    const path = join(folder, LAST_DIR, `${scenarioId}.json`)
    if (!existsSync(path)) return null
    const read = jsonOf(readFileSync(path, "utf8"))
    if (read.kind !== "read" || !isRecord(read.value) || typeof read.value.passed !== "boolean") return null
    const { value } = read
    const failing = Array.isArray(value.failing) ? value.failing : []
    return {
        scenarioId,
        passed: value.passed === true,
        guardsOff: Array.isArray(value.guardsOff) ? value.guardsOff.map(String) : [],
        invariantIds: Array.isArray(value.invariantIds) ? value.invariantIds.map(String) : [],
        failing: failing
            .filter(isRecord)
            .map((item) => ({ name: String(item.name), message: String(item.message ?? "") })),
    }
}

/** A hidden file that is on disk for one run: where it is and the folders made for it. */
export interface PlacedFile {
    /** The absolute path written. */
    readonly path: string
    /** The folders created for it, deepest last. */
    readonly madeFolders: ReadonlyArray<string>
}

/** The first folder of a path that does not exist, from the top, down to the file's folder. */
const missingFolders = (folder: string, root: string): ReadonlyArray<string> =>
    folder.length <= root.length || existsSync(folder) ? [] : [...missingFolders(dirname(folder), root), folder]

/** True when any hidden file would overwrite a file that already exists. */
export const collides = (root: string, files: ReadonlyArray<HiddenFile>): boolean =>
    files.some((file) => existsSync(join(root, file.path)))

/** Writes the hidden files of a challenge under the repo folder; the caller must wipe them with `wipe`. */
export const place = (root: string, files: ReadonlyArray<HiddenFile>): ReadonlyArray<PlacedFile> =>
    files.map((file) => {
        const path = join(root, file.path)
        const madeFolders = missingFolders(dirname(path), root)
        mkdirSync(dirname(path), { recursive: true })
        writeFileSync(path, Buffer.from(file.contentBase64, "base64"), { mode: 0o600 })
        return { path, madeFolders }
    })

/** Overwrites each placed file with zeros, deletes it and the folders made for it: nothing of the hidden source stays on disk. */
export const wipe = (placed: ReadonlyArray<PlacedFile>): void => {
    placed.forEach((file) => {
        try {
            if (existsSync(file.path)) {
                writeFileSync(file.path, Buffer.alloc(statSync(file.path).size))
                rmSync(file.path, { force: true })
            }
        } finally {
            ;[...file.madeFolders].reverse().forEach((folder) => {
                try {
                    rmdirSync(folder)
                } catch {
                    // the folder holds something else now; leave it
                }
            })
        }
    })
}
