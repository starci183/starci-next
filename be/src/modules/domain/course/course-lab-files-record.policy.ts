import { createHash } from "node:crypto"
import { z } from "zod"
import { contentHashOf } from "./course-lab-record.policy"

/** The `schema` of a lab files record of the seed standard, when a record names it. */
export const COURSE_LAB_FILES_SCHEMA = "starci-next-seed-standard/essentials-lab-files@1"

const slug = z
    .string()
    .max(100)
    .regex(/^[a-z0-9][a-z0-9-]*$/u)

const PATH_MAX = 300

/** True for a path a lab cut may hold: relative, posix, no empty, `.` or `..` segment and not git's own. */
const pathSafe = (path: string): boolean =>
    path !== "" &&
    path.length <= PATH_MAX &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.split("/").some((part) => part === ".." || part === "." || part === "" || part === ".git")

const sha256Of = (text: string): string => createHash("sha256").update(text, "utf8").digest("hex")

/** One file of a cut: its path, the SHA-256 (hex) of its text and the text. The hash must be the text's own. */
const fileEntry = z
    .looseObject({
        path: z.string().refine(pathSafe, "a relative posix path"),
        sha256: z.string().regex(/^[0-9a-f]{64}$/u),
        text: z.string(),
    })
    .refine((file) => file.sha256 === sha256Of(file.text), "sha256 is the hash of the text")

const fileList = z.array(fileEntry)

const grader = z.looseObject({
    command: z.string().min(1),
    /** The folder, relative to the lab, every hidden file lives under (`grader/`). */
    into: z.string().regex(/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\/$/u),
    cells: z.array(z.looseObject({ id: slug, step: slug, fault: slug })).min(1),
    /** The JUnit report the grader writes, relative to the lab; absent means the test report (`test.report`). */
    report: z
        .string()
        .regex(/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u)
        .optional(),
})

/**
 * The lab files record of one lesson in the seed standard, key = lesson id. It is SERVER-ONLY (conventions rule 4): the c0 learner
 * checkout, the NestJS version, the hidden grader and the cells it judges. Loose, like the lab record: the standard may add fields.
 */
const filesRecord = z.looseObject({
    schema: z.literal(COURSE_LAB_FILES_SCHEMA).optional(),
    lessonId: slug,
    /** The rung the checkout is at (`c0-naive`). */
    base: z.string().min(1),
    test: z.looseObject({
        command: z.string().min(1),
        /** The cases command template: `{ids}` becomes the comma-joined case ids. */
        cases: z.string().refine((command) => command.includes("{ids}"), "a cases command that contains {ids}"),
        report: z.string().min(1),
        timeoutMs: z.number().int().min(1000).max(3_600_000),
        /** How the relay installs the lab's dependencies before the first test; absent means `npm ci` when a lockfile is there. */
        install: z
            .string()
            .regex(/^[^\r\n\0]{1,400}$/u)
            .optional(),
    }),
    grader,
    source: fileList.min(1),
    // A lesson with no framework version carries `framework: {}` (no `nestjs` cut): it reads as an empty cut, so the relay offers no framework.
    framework: z.looseObject({ nestjs: fileList.default([]) }),
    hidden: fileList,
})

/** One lab files record, validated. */
export type CourseLabFilesRecord = z.infer<typeof filesRecord>

/** One file of a cut as the record holds it. */
export type CourseLabFileEntry = z.infer<typeof fileEntry>

/** Why a record was refused: its shape, its key, or a file that could leak. */
export type CourseLabFilesRefusal = "COURSE_LAB_FILES_RECORD_INVALID" | "COURSE_LAB_FILES_KEY_MISMATCH"

/** The answer of the record check: the record, or the code that refuses it. */
export type CourseLabFilesCheck =
    | { readonly ok: true; readonly record: CourseLabFilesRecord }
    | { readonly ok: false; readonly refusal: CourseLabFilesRefusal }

const unique = (values: ReadonlyArray<string>): boolean => new Set(values).size === values.length

/** True when a path lies strictly under a folder written with its trailing slash. */
const under = (path: string, folder: string): boolean => path.startsWith(folder) && path.length > folder.length

/**
 * True when every list names each path once, every hidden file lies under the grader's folder, no file of a learner cut (the checkout
 * and the NestJS version) lies under it or under `hidden/` (a grader file must never ride in a cut), and each cell id is unique.
 */
const consistent = (record: CourseLabFilesRecord): boolean => {
    const folder = record.grader.into
    const cuts = [record.source, record.framework.nestjs]
    if (
        ![record.source, record.framework.nestjs, record.hidden].every((files) =>
            unique(files.map((file) => file.path)),
        )
    )
        return false
    if (!record.hidden.every((file) => under(file.path, folder))) return false
    if (cuts.some((files) => files.some((file) => under(file.path, folder) || file.path.split("/")[0] === "hidden")))
        return false
    return unique(record.grader.cells.map((cell) => cell.id))
}

/**
 * Judges the record a seed standard carries for one lab's files: its shape (every hash the text's own), the key equal to the lesson id
 * (a mismatch is refused, never renamed) and the leak guards of `consistent`.
 */
export const courseLabFilesCheckOf = (key: string, value: unknown): CourseLabFilesCheck => {
    const parsed = filesRecord.safeParse(value)
    if (!parsed.success || !consistent(parsed.data)) return { ok: false, refusal: "COURSE_LAB_FILES_RECORD_INVALID" }
    if (parsed.data.lessonId !== key) return { ok: false, refusal: "COURSE_LAB_FILES_KEY_MISMATCH" }
    return { ok: true, record: parsed.data }
}

/** The SHA-256 (hex) of the canonical JSON of the record: the identity of its content. */
export const courseLabFilesHashOf = (record: CourseLabFilesRecord): string => contentHashOf(record)

/** The files of one cut as a stored slice holds them (a json array of `{path, sha256, text}`), or null when it is not a sound list. */
export const courseLabFileListOf = (value: unknown): ReadonlyArray<CourseLabFileEntry> | null => {
    const parsed = fileList.safeParse(value)
    return parsed.success && unique(parsed.data.map((file) => file.path)) ? parsed.data : null
}

/** The test, grader and base a stored record holds, without any file text: what the contract is built from. */
const filesMeta = z.object({
    base: filesRecord.shape.base,
    test: filesRecord.shape.test,
    grader: filesRecord.shape.grader,
    /** How many files the NestJS version has. */
    nestjsFiles: z.number().int().min(0),
})

/** The facts of a files record the contract needs, and no file. */
export type CourseLabFilesMeta = z.infer<typeof filesMeta>

/** The facts of a stored files record without its files, or null when they are not sound. */
export const courseLabFilesMetaOf = (value: unknown): CourseLabFilesMeta | null => {
    const parsed = filesMeta.safeParse(value)
    return parsed.success ? parsed.data : null
}
