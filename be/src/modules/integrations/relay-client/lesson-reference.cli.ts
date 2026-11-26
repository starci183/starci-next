import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import {
    LESSON_REFERENCES,
    type LessonReference,
    isReferencePinned,
    referenceLanguageOf,
    referenceNamed,
    referenceTarballRootOf,
    referenceTarballUrlOf,
    referenceTreeUrlOf,
} from "@modules/platform/relay-protocol"
import { jsonOf } from "./json.mapper"
import type { CliIo } from "./relay-client.contracts"
import { ARCHIVE_NAME, dropArchive, hasFolder, makeFolder, removeFolder, writeArchive } from "./lesson-files.adapter"
import { ARCHIVE_MAX_BYTES, archiveRefusal } from "./source-archive.policy"

/** How long a tar step may take. */
const STEP_TIMEOUT_MS = 120_000

/** The marker `ref` leaves in the folder it made: which repository, commit and language it holds. */
export const REFERENCE_STATE_FILE = ".starci-reference.json"

/** The manifest at the root of a lab folder: when `ref` runs inside a lab, the reference goes next to it, not into it. */
const LAB_MANIFEST = "starci-lab.yaml"

/** What a reference folder's marker says. */
interface ReferenceState {
    readonly repo: string
    readonly commit: string
    readonly lang: string
}

/** The folder name of one language of a reference: `essential-saga-typescript`. */
export const referenceFolderOf = (reference: LessonReference, lang: string): string =>
    `${reference.repo.slice(reference.repo.indexOf("/") + 1)}-${lang}`

/**
 * Where the reference folder goes: beside the lab. `--dir` names the folder to put it in; otherwise the current folder, or its parent when
 * the current folder is a lab (it holds `starci-lab.yaml`), so the reference never lands inside the learner's own checkout.
 */
export const referenceParentOf = (cwd: string, dir: string | undefined, isLab: (folder: string) => boolean): string => {
    if (dir !== undefined) return resolve(cwd, dir)
    return isLab(cwd) ? dirname(cwd) : cwd
}

const readState = (folder: string): ReferenceState | null => {
    const path = join(folder, REFERENCE_STATE_FILE)
    if (!existsSync(path)) return null
    const read = jsonOf(readFileSync(path, "utf8"))
    if (read.kind !== "read" || typeof read.value !== "object" || read.value === null) return null
    const value = read.value as Record<string, unknown>
    return typeof value.repo === "string" && typeof value.commit === "string" && typeof value.lang === "string"
        ? { repo: value.repo, commit: value.commit, lang: value.lang }
        : null
}

/**
 * `starci-relay ref <lesson> [--lang <lang>] [--dir <folder>]`: puts one language folder of the lesson's standard reference repository,
 * at the commit the lesson pins, next to the learner's lab. The repository is public, so this needs no login and sends no token: it
 * downloads GitHub's tarball of that commit, refuses it unless every entry is a plain file or folder under the repository's root, and
 * unpacks only the language folder. Answers the exit code.
 */
export const refLesson = async (
    io: CliIo,
    name: string,
    lang: string | undefined,
    dir: string | undefined,
    cwd: string,
    references: ReadonlyArray<LessonReference> = LESSON_REFERENCES,
): Promise<number> => {
    const reference = referenceNamed(name, references)
    if (reference === undefined || !isReferencePinned(reference)) {
        const known = references.filter(isReferencePinned).map((each) => each.name)
        io.err(`No reference repository for "${name}". Known: ${known.length === 0 ? "none yet" : known.join(", ")}.`)
        return 1
    }
    const language = referenceLanguageOf(reference, lang)
    if (language === undefined) {
        io.err(`${reference.repo} has no ${lang ?? ""} folder yet; available: ${reference.languages.map((each) => each.id).join(", ")}.`)
        return 1
    }
    const parent = referenceParentOf(cwd, dir, (folder) => existsSync(join(folder, LAB_MANIFEST)))
    if (!hasFolder(parent)) {
        io.err(`${parent} is not a folder.`)
        return 1
    }
    const folderName = referenceFolderOf(reference, language.id)
    const target = join(parent, folderName)
    const short = reference.commit.slice(0, 10)
    if (existsSync(target)) {
        const had = readState(target)
        const same = had !== null && had.repo === reference.repo && had.commit === reference.commit && had.lang === language.id
        io.out(
            same
                ? `${folderName} is already here at ${short}.`
                : `${target} already exists and is not this reference; move it away and run ref again.`,
        )
        return same ? 0 : 1
    }
    const answer = await io.download(referenceTarballUrlOf(reference), undefined)
    if (answer.status !== 200) {
        io.err(answer.status === 0 ? "GitHub could not be reached." : `GitHub refused the download (HTTP ${answer.status}).`)
        return 1
    }
    if (answer.bytes.length === 0 || answer.bytes.length > ARCHIVE_MAX_BYTES) {
        io.err("The download is empty or too large; nothing was unpacked.")
        return 1
    }
    makeFolder(target)
    const failed = (line: string): number => {
        removeFolder(target)
        io.err(line)
        return 1
    }
    const step = (command: string) => io.runCommand(command, target, STEP_TIMEOUT_MS, undefined, true)
    writeArchive(target, answer.bytes)
    const names = await step(`tar -tzf ${ARCHIVE_NAME}`)
    const types = await step(`tar -tvzf ${ARCHIVE_NAME}`)
    const root = referenceTarballRootOf(reference)
    const refusal =
        names.exitCode === 0 && types.exitCode === 0 ? archiveRefusal(names.output, types.output) : "tar could not read it"
    if (refusal !== null) return failed(`Not unpacked: ${refusal}.`)
    const outside = names.output
        .split(/\r?\n/u)
        .map((line) => line.trim().replace(/^\.\//u, ""))
        .find((path) => path !== "" && path !== root && !path.startsWith(`${root}/`))
    if (outside !== undefined) return failed(`Not unpacked: ${outside} is outside ${root}/.`)
    const extracted = await step(`tar -xzf ${ARCHIVE_NAME} --strip-components=2 ${root}/${language.folder}`)
    dropArchive(target)
    if (extracted.exitCode !== 0 || readdirSync(target).length === 0)
        return failed(`The reference has no ${language.folder}/ folder at ${short}; nothing was unpacked.`)
    const state: ReferenceState = { repo: reference.repo, commit: reference.commit, lang: language.id }
    writeFileSync(join(target, REFERENCE_STATE_FILE), `${JSON.stringify(state, null, 2)}\n`, "utf8")
    io.out(`The ${language.label} reference of ${reference.name} is in ${target} (${reference.repo} at ${short}).`)
    io.out(`On GitHub: ${referenceTreeUrlOf(reference, language)}`)
    io.out("Read its README.md first.")
    return 0
}
