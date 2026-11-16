import { createHash } from "node:crypto"
import { gzipSync } from "node:zlib"
import type { LessonSourceFile } from "./lesson-import.contracts"

/**
 * The lesson's source code lives in the content repository beside the lesson (owner 2026-11-17): `source/` is what the learner
 * pulls, `hidden/` holds the hidden challenge tests and never leaves the server except one file at a time in a signed
 * challenge manifest.
 */
export const LESSON_SOURCE_FOLDER = "source/"

/** One file of a lesson's `source/` folder, its path relative to that folder. */
export interface LessonSourceCode {
    /** The path inside `source/`, posix. */
    readonly path: string
    /** The text. */
    readonly content: string
}

/** The files of the lesson folder under `source/`, sorted, their paths relative to it; nothing outside it (no `hidden/`) and no `.git`. */
export const sourceCodeOf = (files: ReadonlyArray<LessonSourceFile>): Array<LessonSourceCode> =>
    files
        .filter((file) => file.path.startsWith(LESSON_SOURCE_FOLDER) && file.path.length > LESSON_SOURCE_FOLDER.length)
        .filter((file) => !file.path.split("/").includes(".git"))
        .map((file) => ({ path: file.path.slice(LESSON_SOURCE_FOLDER.length), content: file.text }))
        .sort((a, b) => a.path.localeCompare(b.path))

/** The size of a tar block. */
const BLOCK = 512

/** The NUL that ends tar header fields. */
const NUL = String.fromCharCode(0)

/** The line end of a pax record. */
const LF = String.fromCharCode(10)

/** One octal field of a tar header, NUL terminated. */
const octal = (value: number, width: number): string => `${value.toString(8).padStart(width - 1, "0")}${NUL}`

/** The ustar name and prefix of a path, or null when it does not fit them (a pax header then carries it). */
const ustarNameOf = (name: string): { readonly base: string; readonly prefix: string } | null => {
    if (Buffer.byteLength(name) <= 100) return { base: name, prefix: "" }
    const split = name.lastIndexOf("/")
    const base = name.slice(split + 1)
    const prefix = name.slice(0, Math.max(split, 0))
    return split > 0 && Buffer.byteLength(base) <= 100 && Buffer.byteLength(prefix) <= 155 ? { base, prefix } : null
}

/** A ustar header: mode 0644, owner 0, time 0, so the same files always make the same bytes. */
const headerOf = (name: string, size: number, type: "0" | "x"): Buffer => {
    const header = Buffer.alloc(BLOCK, 0)
    const fitted = ustarNameOf(name) ?? { base: name.slice(-100), prefix: "" }
    header.write(fitted.base, 0, 100, "utf8")
    header.write(octal(0o644, 8), 100, 8, "ascii")
    header.write(octal(0, 8), 108, 8, "ascii")
    header.write(octal(0, 8), 116, 8, "ascii")
    header.write(octal(size, 12), 124, 12, "ascii")
    header.write(octal(0, 12), 136, 12, "ascii")
    header.write("        ", 148, 8, "ascii")
    header.write(type, 156, 1, "ascii")
    header.write(`ustar${NUL}`, 257, 6, "ascii")
    header.write("00", 263, 2, "ascii")
    header.write(fitted.prefix, 345, 155, "utf8")
    const sum = header.reduce((total, byte) => total + byte, 0)
    header.write(`${sum.toString(8).padStart(6, "0")}${NUL} `, 148, 8, "ascii")
    return header
}

/** Pads a body to whole blocks. */
const paddingOf = (length: number): Buffer => Buffer.alloc((BLOCK - (length % BLOCK)) % BLOCK, 0)

/** The pax `path` record of a name too long for ustar: `<length> path=<name>` and a line end, the length counting itself. */
const paxPathOf = (name: string): Buffer => {
    const tail = ` path=${name}${LF}`
    let length = Buffer.byteLength(tail) + 1
    while (String(length).length + Buffer.byteLength(tail) !== length) length += 1
    return Buffer.from(`${length}${tail}`, "utf8")
}

/** The blocks of one regular file: a pax header first when its name does not fit ustar, then its header and body. */
const entryOf = (file: LessonSourceCode): Array<Buffer> => {
    const body = Buffer.from(file.content, "utf8")
    const pax = ustarNameOf(file.path) === null ? paxPathOf(file.path) : null
    return [
        ...(pax === null ? [] : [headerOf("PaxHeader", pax.length, "x"), pax, paddingOf(pax.length)]),
        headerOf(file.path, body.length, "0"),
        body,
        paddingOf(body.length),
    ]
}

/** The tarball of a lesson's source and its SHA-256. */
export interface LessonSourceArchive {
    /** The gzip-compressed ustar archive of the contents of `source/` (no `source/` prefix). */
    readonly content: Buffer
    /** The lowercase hex SHA-256 of `content`. */
    readonly sha256: string
}

/**
 * A deterministic `.tar.gz` of the CONTENTS of `source/` (SCENARIO-CONTRACT v3 §4): relative entry names with no `source/`
 * prefix, regular files only, sorted, mode 0644, owner 0, time 0, gzip without a name or time, so a version always yields the
 * same bytes and the same SHA-256 the manifest signs.
 */
export const sourceArchiveOf = (files: ReadonlyArray<LessonSourceCode>): LessonSourceArchive => {
    const blocks = files.flatMap((file) => entryOf(file))
    const tar = Buffer.concat([...blocks, Buffer.alloc(BLOCK * 2, 0)])
    const content = gzipSync(tar, { level: 9 })
    return { content, sha256: createHash("sha256").update(content).digest("hex") }
}
