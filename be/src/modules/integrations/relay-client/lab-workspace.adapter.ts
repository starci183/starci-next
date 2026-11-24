import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { configPathOf } from "./device-settings.adapter"
import { isRecord, jsonOf } from "./json.mapper"
import type { HintLedger } from "./lab-case.policy"
import { LAB_MANIFEST_FILE } from "./lab-manifest.schema"
import { courseOf, labManifestOf, type LabManifest, type LabManifestRead } from "./lab-manifest.policy"
import type { ConfigEnv } from "./relay-client.config"

/** How many folders up from the current one a lab root is looked for: enough for any folder inside a lab, never the whole disk. */
const ROOT_SEARCH_DEPTH = 12

/**
 * The folder of the lab the learner stands in: the nearest folder, from `cwd` up, that holds a `starci-lab.yaml`. The learner (and
 * an editor that starts the MCP) may stand in a sub-folder such as `services/orders`; the case commands still find their lab.
 */
export const labRootOf = (cwd: string): string | null => {
    let folder = resolve(cwd)
    for (let depth = 0; depth < ROOT_SEARCH_DEPTH; depth += 1) {
        if (existsSync(join(folder, LAB_MANIFEST_FILE))) return folder
        const parent = dirname(folder)
        if (parent === folder) return null
        folder = parent
    }
    return null
}

/** What finding the lab of a folder came to. */
export type LabWorkspace =
    | { readonly kind: "found"; readonly root: string; readonly manifest: LabManifest }
    | { readonly kind: "no-lab" }
    | { readonly kind: "invalid"; readonly root: string; readonly problems: ReadonlyArray<string> }

/** The lab of a folder: its root and its parsed manifest, or why there is none. */
export const labWorkspaceOf = (cwd: string): LabWorkspace => {
    const root = labRootOf(cwd)
    if (root === null) return { kind: "no-lab" }
    const read: LabManifestRead = labManifestOf(readFileSync(join(root, LAB_MANIFEST_FILE), "utf8"))
    return read.kind === "read"
        ? { kind: "found", root, manifest: read.manifest }
        : { kind: "invalid", root, problems: read.problems }
}

/** The last JUnit report of the lab with when it was written, or null when there is none yet. */
export const readLabReport = (
    root: string,
    manifest: LabManifest,
): { readonly xml: string; readonly writtenAt: string } | null => {
    const path = join(root, manifest.test.report)
    if (!existsSync(path) || !statSync(path).isFile()) return null
    return { xml: readFileSync(path, "utf8"), writtenAt: statSync(path).mtime.toISOString() }
}

/** The settings folder of one lab on this machine, beside the relay's config: `labs/<course>/<lesson>`. */
const labSettingsOf = (env: ConfigEnv, courseId: string, lessonId: string): string =>
    join(dirname(configPathOf(env)), "labs", courseId, lessonId)

/** The file that names the folder the learner chose for a lab (`lab start --dir`). */
const labFolderFileOf = (env: ConfigEnv, courseId: string, lessonId: string): string =>
    join(labSettingsOf(env, courseId, lessonId), "folder.json")

/**
 * The folder the learner chose for a lab with `lab start --dir`, or null when they kept the default `~/starci/<course>/<lesson>`.
 * Kept in the relay's settings (not in the lab folder, which may not exist yet) so a boot the web pushes later lands where they chose.
 */
export const readLabFolder = (env: ConfigEnv, courseId: string, lessonId: string): string | null => {
    const path = labFolderFileOf(env, courseId, lessonId)
    if (!existsSync(path)) return null
    const read = jsonOf(readFileSync(path, "utf8"))
    return read.kind === "read" && isRecord(read.value) && typeof read.value.dir === "string" ? read.value.dir : null
}

/** Records the folder of a lab, readable by this user alone. */
export const writeLabFolder = (env: ConfigEnv, courseId: string, lessonId: string, dir: string): void => {
    const path = labFolderFileOf(env, courseId, lessonId)
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    writeFileSync(
        path,
        `${JSON.stringify({ dir })}
`,
        { encoding: "utf8", mode: 0o600 },
    )
}

/** Forgets the folder `lab start --dir` recorded, so the web's `learnerDir` (else the default) applies again. */
export const clearLabFolder = (env: ConfigEnv, courseId: string, lessonId: string): void => {
    rmSync(labFolderFileOf(env, courseId, lessonId), { force: true })
}

/** The file that names the folder a lab was last booted into, apart from `folder.json` so a booted folder never passes for a typed `--dir`. */
const bootedFolderFileOf = (env: ConfigEnv, courseId: string, lessonId: string): string =>
    join(labSettingsOf(env, courseId, lessonId), "booted.json")

/**
 * The folder the lab was last booted into on this machine, or null before any boot. Kept beside `folder.json` in the relay's settings:
 * the manifest of a grade or a test carries no `learnerDir`, so this is how those commands find a lab the web placed elsewhere.
 */
export const readBootedFolder = (env: ConfigEnv, courseId: string, lessonId: string): string | null => {
    const path = bootedFolderFileOf(env, courseId, lessonId)
    if (!existsSync(path)) return null
    const read = jsonOf(readFileSync(path, "utf8"))
    return read.kind === "read" && isRecord(read.value) && typeof read.value.dir === "string" ? read.value.dir : null
}

/** Records the folder a lab booted into, readable by this user alone. */
export const writeBootedFolder = (env: ConfigEnv, courseId: string, lessonId: string, dir: string): void => {
    const path = bootedFolderFileOf(env, courseId, lessonId)
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    writeFileSync(path, `${JSON.stringify({ dir })}
`, { encoding: "utf8", mode: 0o600 })
}

/**
 * Where the hint levels a learner opened are recorded: beside the relay's config, under the lab and lesson, never inside the
 * learner's checkout. Kept out of the checkout so a commit never carries it and a `case reset-to` never rewinds it: the count is
 * what the relay reports with a submission, and it must only grow.
 */
const hintsPathOf = (env: ConfigEnv, manifest: LabManifest): string =>
    join(labSettingsOf(env, courseOf(manifest), manifest.lessonId), "hints.json")

/** The hint levels opened per case; an unreadable or missing record is an empty one. */
export const readHintLedger = (env: ConfigEnv, manifest: LabManifest): HintLedger => {
    const path = hintsPathOf(env, manifest)
    if (!existsSync(path)) return {}
    const read = jsonOf(readFileSync(path, "utf8"))
    if (read.kind !== "read" || !isRecord(read.value) || !isRecord(read.value.opened)) return {}
    return Object.fromEntries(
        Object.entries(read.value.opened).filter(
            (entry): entry is [string, number] => typeof entry[1] === "number" && Number.isInteger(entry[1]),
        ),
    )
}

/** Records the hint levels opened, with the time of the last opening, readable by this user alone. */
export const writeHintLedger = (env: ConfigEnv, manifest: LabManifest, ledger: HintLedger, at: string): void => {
    const path = hintsPathOf(env, manifest)
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    writeFileSync(path, `${JSON.stringify({ lab: manifest.lab, lessonId: manifest.lessonId, opened: ledger, at })}\n`, {
        encoding: "utf8",
        mode: 0o600,
    })
}

/**
 * Where the concept graph of the lesson is: `--concepts <file>` when given, else `.starci/concepts.yaml` of the lab, where the
 * relay puts the graph it gets with the lesson data. Null when neither exists; `explain` then answers that the graph is missing.
 */
export const conceptGraphPathOf = (root: string, given: string | undefined, cwd: string): string | null => {
    const path = given === undefined ? join(root, ".starci", "concepts.yaml") : resolve(cwd, given)
    return existsSync(path) ? path : null
}

/** The text of a file, or null when it is missing. */
export const readTextFile = (path: string): string | null => (existsSync(path) ? readFileSync(path, "utf8") : null)

/**
 * Writes some files into a fresh temporary folder, runs `work` there and always removes the folder. `case diff` compares two rungs
 * StarCi served this way: they never land in the learner's checkout, so no reference file is left lying beside the learner's own.
 */
export const withScratchFiles = async <T>(
    files: ReadonlyArray<{ readonly name: string; readonly content: string }>,
    work: (dir: string) => Promise<T>,
): Promise<T> => {
    const dir = mkdtempSync(join(tmpdir(), "starci-rungs-"))
    try {
        files.forEach((file) => writeFileSync(join(dir, file.name), file.content, "utf8"))
        return await work(dir)
    } finally {
        rmSync(dir, { recursive: true, force: true })
    }
}

/** Writes a rung StarCi served over the learner file of the lab (a path the manifest's schema keeps inside the lab). */
export const writeLabFile = (root: string, path: string, content: string): void => {
    const full = join(root, path)
    mkdirSync(dirname(full), { recursive: true })
    writeFileSync(full, content, "utf8")
}
