import { deflateRawSync } from "node:zlib"
import type { LessonWorkspaceVariant } from "./lesson.contracts"

/** One file of an archive: a relative path and its text. */
export interface ArchiveEntry {
    /** The path inside the archive, with forward slashes. */
    readonly path: string
    /** The file text, stored as UTF-8. */
    readonly content: string
}

/** One header field: its value and its width in bytes (2 or 4). */
type Field = readonly [value: number, width: 2 | 4]

/** ZIP signature of a local file header. */
const LOCAL_SIGNATURE = 0x04_03_4b_50

/** ZIP signature of a central directory header. */
const CENTRAL_SIGNATURE = 0x02_01_4b_50

/** ZIP signature of the end of the central directory. */
const END_SIGNATURE = 0x06_05_4b_50

/** Version needed to extract and made by: 2.0, which covers deflate. */
const ZIP_VERSION = 20

/** General purpose flag: the names are UTF-8. */
const UTF8_FLAG = 0x08_00

/** Compression method 8: deflate. */
const DEFLATE = 8

/** The DOS date 1980-01-01, fixed so one workspace always makes the same bytes. */
const DOS_DATE = 0x00_21

/** The DOS time 00:00. */
const DOS_TIME = 0

/** The CRC-32 polynomial of the IEEE checksum, reflected. */
const CRC_POLYNOMIAL = 0xed_b8_83_20

const CRC_TABLE: ReadonlyArray<number> = Array.from({ length: 256 }, (_unused, index) => {
    let value = index
    for (let bit = 0; bit < 8; bit += 1) value = (value & 1) === 1 ? (value >>> 1) ^ CRC_POLYNOMIAL : value >>> 1
    return value >>> 0
})

/** The CRC-32 (IEEE) of the bytes, as an unsigned number. */
export const crc32Of = (bytes: Uint8Array): number => {
    let crc = 0xff_ff_ff_ff
    for (const byte of bytes) crc = (CRC_TABLE[(crc ^ byte) & 0xff] ?? 0) ^ (crc >>> 8)
    return (crc ^ 0xff_ff_ff_ff) >>> 0
}

/** A path safe to unpack: slashes only, no leading slash, no empty, `.` or `..` segment; null when nothing safe remains. */
export const safeArchivePath = (path: string): string | null => {
    const segments = path.replaceAll("\\", "/").split("/")
    if (segments.some((segment) => segment === ".." || segment.includes(":"))) return null
    const kept = segments.filter((segment) => segment !== "" && segment !== ".")
    return kept.length === 0 ? null : kept.join("/")
}

const headerOf = (fields: ReadonlyArray<Field>): Buffer => {
    const buffer = Buffer.alloc(fields.reduce((total, [, width]) => total + width, 0))
    let offset = 0
    for (const [value, width] of fields) {
        if (width === 4) buffer.writeUInt32LE(value, offset)
        else buffer.writeUInt16LE(value, offset)
        offset += width
    }
    return buffer
}

/**
 * A ZIP archive (deflate, UTF-8 names, fixed timestamps) of the entries, written by hand from the ZIP specification so no
 * dependency is needed. An entry whose path is unsafe is dropped; the first of two entries with one path wins.
 */
export const zipOf = (entries: ReadonlyArray<ArchiveEntry>): Buffer => {
    const seen = new Set<string>()
    const locals: Array<Buffer> = []
    const centrals: Array<Buffer> = []
    let offset = 0
    for (const entry of entries) {
        const path = safeArchivePath(entry.path)
        if (path === null || seen.has(path)) continue
        seen.add(path)
        const name = Buffer.from(path, "utf8")
        const raw = Buffer.from(entry.content, "utf8")
        const packed = deflateRawSync(raw)
        const common: ReadonlyArray<Field> = [
            [UTF8_FLAG, 2],
            [DEFLATE, 2],
            [DOS_TIME, 2],
            [DOS_DATE, 2],
            [crc32Of(raw), 4],
            [packed.length, 4],
            [raw.length, 4],
            [name.length, 2],
        ]
        const local = Buffer.concat([
            headerOf([[LOCAL_SIGNATURE, 4], [ZIP_VERSION, 2], ...common, [0, 2]]),
            name,
            packed,
        ])
        const central = Buffer.concat([
            headerOf([
                [CENTRAL_SIGNATURE, 4],
                [ZIP_VERSION, 2],
                [ZIP_VERSION, 2],
                ...common,
                [0, 2],
                [0, 2],
                [0, 2],
                [0, 2],
                [0, 4],
                [offset, 4],
            ]),
            name,
        ])
        locals.push(local)
        centrals.push(central)
        offset += local.length
    }
    const directory = Buffer.concat(centrals)
    const end = headerOf([
        [END_SIGNATURE, 4],
        [0, 2],
        [0, 2],
        [centrals.length, 2],
        [centrals.length, 2],
        [directory.length, 4],
        [offset, 4],
        [0, 2],
    ])
    return Buffer.concat([...locals, directory, end])
}

/** The test commands of a workspace as a short README for the unpacked folder. */
const readmeOf = (variant: LessonWorkspaceVariant): string => {
    const lines = [`# ${variant.language}`, "", `Runtime: ${variant.runtime}`, "", "## How to run the tests", ""]
    if (variant.commands.windows) lines.push("Windows:", "", "```", variant.commands.windows, "```", "")
    if (variant.commands.unix) lines.push("macOS / Linux:", "", "```", variant.commands.unix, "```", "")
    return lines.join("\n")
}

/** The entries of one language workspace: its files at their lesson-relative paths, and a README with the test commands. */
export const workspaceEntriesOf = (variant: LessonWorkspaceVariant): Array<ArchiveEntry> => [
    ...variant.files.map((file) => ({ path: file.path, content: file.content })),
    { path: "README.md", content: readmeOf(variant) },
]
