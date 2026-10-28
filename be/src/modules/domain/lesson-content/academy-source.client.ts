import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import { parseFixtureManifest } from "./academy-manifest.mapper"
import type { FixtureManifest } from "./academy-manifest.mapper"
import { sha256Hex } from "./academy-document.mapper"

/** One Academy snapshot as the importer consumes it: the validated manifest and every file it records, bytes exact. */
export interface AcademySource {
    /** The manifest of this AcademySource. */
    readonly manifest: FixtureManifest
    /** The SHA-256 of the manifest bytes; the identity of the immutable snapshot a version was imported from. */
    readonly manifestSha256: string
    /** The raw bytes of each recorded file, keyed by its fixture-relative path. */
    readonly files: ReadonlyMap<string, Uint8Array>
    /** The verified SHA-256 of each recorded file, for the import report. */
    readonly fileHashes: Readonly<Record<string, string>>
}

const invalid = (field: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.ManifestInvalid, params: { field } })

const mismatch = (field: string): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.SourceMismatch, params: { field } })

/** Reads one file of the snapshot; a path that escapes the fixture root or is unreadable is a manifest defect. */
const readOne = async (fixtureDir: string, fixturePath: string): Promise<Uint8Array> => {
    if (fixturePath.startsWith("/") || fixturePath.includes("\\") || fixturePath.split("/").includes("..")) {
        throw invalid("files[].fixturePath")
    }
    try {
        return await readFile(join(fixtureDir, ...fixturePath.split("/")))
    } catch (error) {
        throw new LessonContentError({
            code: LessonContentErrorCode.SourceMismatch,
            params: { field: fixturePath },
            cause: error,
        })
    }
}

/**
 * Reads the versioned machine input of a fixture directory and every file it records. The manifest is validated
 * field by field first; then each file is read and checked against its recorded byte count and SHA-256 before any
 * source byte is parsed. Nothing here executes the content.
 */
export const readAcademySource = async (fixtureDir: string): Promise<AcademySource> => {
    let manifestRaw: Uint8Array
    try {
        manifestRaw = await readFile(join(fixtureDir, "manifest.json"))
    } catch (error) {
        throw new LessonContentError({
            code: LessonContentErrorCode.ManifestInvalid,
            params: { field: "manifest.json" },
            cause: error,
        })
    }
    const manifest = parseFixtureManifest(new TextDecoder().decode(manifestRaw))
    const files = new Map<string, Uint8Array>()
    const fileHashes: Record<string, string> = {}
    const reads = await Promise.all(
        manifest.files.map(async (recorded) => ({ recorded, raw: await readOne(fixtureDir, recorded.fixturePath) })),
    )
    for (const { recorded, raw } of reads) {
        if (raw.byteLength !== recorded.bytes || sha256Hex(raw) !== recorded.sha256)
            throw mismatch(recorded.fixturePath)
        files.set(recorded.fixturePath, raw)
        fileHashes[recorded.fixturePath] = recorded.sha256
    }
    return { manifest, manifestSha256: sha256Hex(manifestRaw), files, fileHashes }
}
