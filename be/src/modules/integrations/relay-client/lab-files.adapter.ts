import {
    chmodSync,
    existsSync,
    mkdirSync,
    mkdtempSync,
    readdirSync,
    readFileSync,
    rmSync,
    statSync,
    writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve, sep } from "node:path"
import type { LabHiddenFile } from "./lab.contracts"
import { configPathOf } from "./device-settings.adapter"
import type { ConfigEnv } from "./relay-client.config"

/** The file of the device's private key, beside the config in the settings folder. */
export const deviceKeyPathOf = (env: ConfigEnv): string => join(dirname(configPathOf(env)), "device-key.pem")

/** Keeps the device's private key readable by this user alone (0600; on Windows the user profile's own access rules apply). */
export const writeDeviceKey = (env: ConfigEnv, privatePem: string): void => {
    const path = deviceKeyPathOf(env)
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    writeFileSync(path, privatePem, { encoding: "utf8", mode: 0o600 })
    chmodSync(path, 0o600)
}

/** The device's private key PEM, or null when this machine has none. */
export const readDeviceKey = (env: ConfigEnv): string | null => {
    const path = deviceKeyPathOf(env)
    return existsSync(path) ? readFileSync(path, "utf8") : null
}

/** The path inside a folder, or null when it would land outside it. */
const insideOf = (root: string, path: string): string | null => {
    const base = resolve(root)
    const target = resolve(base, path)
    return target.startsWith(`${base}${sep}`) ? target : null
}

/** The bytes of a file under the clone, or null when it is missing, is not a file or is outside the folder. */
export const readTreeFile = (root: string, path: string): Buffer | null => {
    const target = insideOf(root, path)
    if (target === null || !existsSync(target) || !statSync(target).isFile()) return null
    return readFileSync(target)
}

/** The text of a file under a folder, or null. */
export const readTreeText = (root: string, path: string): string | null =>
    readTreeFile(root, path)?.toString("utf8") ?? null

/** Removes a file under a folder; a missing one is fine. */
export const removeTreeFile = (root: string, path: string): void => {
    const target = insideOf(root, path)
    if (target !== null) rmSync(target, { force: true })
}

/** Writes the hidden files into a folder, each parent made; a path that would leave the folder is refused with its name. */
export const writeHiddenFiles = (root: string, files: ReadonlyArray<LabHiddenFile>): ReadonlyArray<string> =>
    files.map((file) => {
        const target = insideOf(root, file.path)
        if (target === null) throw new Error(`hidden file ${file.path} is outside the checkout`)
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, Buffer.from(file.content, "base64"), { mode: 0o600 })
        return file.path
    })

/** Whether a folder holds a git repository. */
export const hasRepository = (folder: string): boolean => existsSync(join(folder, ".git"))

/** Whether a path exists. */
export const hasPath = (path: string): boolean => existsSync(path)

/** Whether a path is a folder with nothing in it. */
export const isEmptyFolder = (path: string): boolean =>
    existsSync(path) && statSync(path).isDirectory() && readdirSync(path).length === 0

/** Where a lab folder keeps which chaos switches are on: inside `.git`, so it never shows as a change and is never committed. */
const CHAOS_STATE = join(".git", "starci-chaos.json")

/** The chaos switches last written down as on in a lab folder; none when nothing was written or it cannot be read. */
export const readChaosOn = (root: string): ReadonlyArray<string> => {
    const text = readTreeText(root, CHAOS_STATE)
    try {
        const parsed: unknown = text === null ? [] : JSON.parse(text)
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
    } catch {
        return []
    }
}

/** Writes down which chaos switches are on in a lab folder. */
export const writeChaosOn = (root: string, ids: ReadonlyArray<string>): void => {
    writeFileSync(join(root, CHAOS_STATE), `${JSON.stringify(ids)}\n`, "utf8")
}

/** A new private temporary folder for one grading run. */
export const makeGradeFolder = (): string => mkdtempSync(join(tmpdir(), "starci-grade-"))

/** Removes a folder and everything under it; a missing one is fine. */
export const removeTree = (path: string): void => {
    rmSync(path, { recursive: true, force: true })
}
