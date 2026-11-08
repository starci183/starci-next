import { parseSeparatorFields } from "./separator.policy"
import { isRootFile, isSectionFile, rootIssues, sectionIssues } from "./lesson-format.policy"
import type { ShapeIssue } from "./shape.policy"
import type {
    LessonIssue,
    LessonParsedLocale,
    LessonParsedSource,
    LessonSourceFile,
    LessonSourceResult,
} from "./lesson-import.contracts"
import type { LessonLocale, LessonSection } from "./lesson.contracts"

const JSON_FIELDS: ReadonlySet<string> = new Set([
    "learningOutcomes",
    "prerequisites",
    "references",
    "activities",
    "workspace",
])
const NUMBER_FIELDS: ReadonlySet<string> = new Set(["minutesRead", "sortIndex"])
const SECTION_FILE = /^sections\/([^/]+)\/(?:vi|en)\.md$/u

const issueOf = (path: string, field: string, message: string): LessonIssue => ({ path, field, message })

/** The result of reading one file: its typed fields, or the issues that block it. */
interface FileRead<T> {
    readonly file: T | null
    readonly issues: ReadonlyArray<LessonIssue>
}

/** The result of reading a json field: its value, or the failure the text carries. */
type JsonRead =
    { readonly kind: "read"; readonly value: unknown } | { readonly kind: "failed"; readonly cause: unknown }

const readJson = (raw: string): JsonRead => {
    try {
        return { kind: "read", value: JSON.parse(raw) }
    } catch (cause) {
        return { kind: "failed", cause }
    }
}

const decodeField = (path: string, name: string, raw: string, issues: Array<LessonIssue>): unknown => {
    if (NUMBER_FIELDS.has(name)) {
        if (/^\d+$/u.test(raw)) return Number(raw)
        issues.push(issueOf(path, name, "expected a whole number"))
    } else if (JSON_FIELDS.has(name)) {
        const json = readJson(raw)
        if (json.kind === "read") return json.value
        issues.push(issueOf(path, name, `is not valid json: ${String(json.cause)}`))
    }
    return raw
}

const readFile = <T>(
    path: string,
    text: string,
    isFile: (value: unknown) => value is T,
    shapeOf: (value: unknown) => Array<ShapeIssue>,
): FileRead<T> => {
    const parsed = parseSeparatorFields(text)
    const issues = parsed.problems.map((problem) => issueOf(path, "", problem))
    const record: Record<string, unknown> = {}
    Object.entries(parsed.fields).forEach(([name, raw]) => {
        record[name] = decodeField(path, name, raw, issues)
    })
    if (issues.length > 0) return { file: null, issues }
    if (isFile(record)) return { file: record, issues: [] }
    return { file: null, issues: shapeOf(record).map((found) => issueOf(path, found.field, found.message)) }
}

const sectionIdsOf = (files: ReadonlyArray<LessonSourceFile>): Array<string> =>
    [...new Set(files.flatMap((file) => SECTION_FILE.exec(file.path)?.[1] ?? []))].sort((a, b) => a.localeCompare(b))

const readOptional = <T>(
    path: string,
    byPath: ReadonlyMap<string, LessonSourceFile>,
    isFile: (value: unknown) => value is T,
    shapeOf: (value: unknown) => Array<ShapeIssue>,
    issues: Array<LessonIssue>,
): T | null => {
    const source = byPath.get(path)
    if (source === undefined) {
        issues.push(issueOf(path, "", "is missing"))
        return null
    }
    const read = readFile(path, source.text, isFile, shapeOf)
    issues.push(...read.issues)
    return read.file
}

const readLocale = (
    locale: LessonLocale,
    byPath: ReadonlyMap<string, LessonSourceFile>,
    sectionIds: ReadonlyArray<string>,
    issues: Array<LessonIssue>,
): LessonParsedLocale | null => {
    const root = readOptional(`${locale}.md`, byPath, isRootFile, rootIssues, issues)
    const sections = sectionIds
        .flatMap((id): Array<LessonSection> => {
            const file = readOptional(`sections/${id}/${locale}.md`, byPath, isSectionFile, sectionIssues, issues)
            return file === null ? [] : [{ ...file, id }]
        })
        .sort((a, b) => a.sortIndex - b.sortIndex || a.id.localeCompare(b.id))
    return root === null ? null : { root, sections }
}

/**
 * Reads the root and section files of both locales from the files of one lesson folder. Every file that cannot be read names
 * its path and field; when any issue exists no parsed source is answered.
 */
export const readLessonSource = (files: ReadonlyArray<LessonSourceFile>): LessonSourceResult => {
    const byPath = new Map(files.map((file) => [file.path, file]))
    const sectionIds = sectionIdsOf(files)
    const issues: Array<LessonIssue> = []
    if (sectionIds.length === 0) issues.push(issueOf("sections", "", "holds no section"))
    const vi = readLocale("vi", byPath, sectionIds, issues)
    const en = readLocale("en", byPath, sectionIds, issues)
    if (issues.length > 0 || vi === null || en === null) return { parsed: null, issues }
    const parsed: LessonParsedSource = { vi, en }
    return { parsed, issues }
}
