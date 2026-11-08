import type { InterviewIssue } from "./interview.contracts"
import { parseMount, type MountDocument, type MountItem, type MountValue } from "./mount.policy"

/** The reader of one source file: its fields, and the issues it adds to a shared list. */
export interface FileReader {
    /** The posix path of the file, for the issues. */
    readonly path: string
    /** The parsed fields. */
    readonly document: MountDocument
    /** The shared issue list. */
    readonly issues: Array<InterviewIssue>
}

/** Parses one source file and reports its layout problems. */
export const readerOf = (path: string, text: string, issues: Array<InterviewIssue>): FileReader => {
    const document = parseMount(text)
    document.problems.forEach((message) => issues.push({ path, field: "", message }))
    return { path, document, issues }
}

/** Adds an issue on a field of the file. */
export const addIssue = (reader: FileReader, field: string, message: string): void => {
    reader.issues.push({ path: reader.path, field, message })
}

/** The text of a required field; an empty text when it is missing or is a list, with an issue. */
export const textOf = (reader: FileReader, field: string): string => {
    const value: MountValue | undefined = reader.document.fields[field]
    if (typeof value !== "string" || value.trim() === "") {
        addIssue(reader, field, "is missing or empty")
        return ""
    }
    return value.trim()
}

/** The text of an optional field, or null. */
export const optionalTextOf = (reader: FileReader, field: string): string | null => {
    const value: MountValue | undefined = reader.document.fields[field]
    return typeof value === "string" && value.trim() !== "" ? value.trim() : null
}

/** The whole number of a required field; 0 when it is not one, with an issue. */
export const integerOf = (reader: FileReader, field: string): number => {
    const text = textOf(reader, field)
    if (/^\d+$/u.test(text)) return Number(text)
    if (text !== "") addIssue(reader, field, "expected a whole number")
    return 0
}

/** The boolean of a required field; false when it is neither `true` nor `false`, with an issue. */
export const booleanOf = (reader: FileReader, field: string): boolean => {
    const text = textOf(reader, field)
    if (text !== "" && text !== "true" && text !== "false") addIssue(reader, field, "expected true or false")
    return text === "true"
}

/** The value of a required field when it is one of the allowed texts; the first allowed text otherwise, with an issue. */
export const choiceOf = <T extends string>(
    reader: FileReader,
    field: string,
    allowed: readonly [T, ...Array<T>],
): T => {
    const text = textOf(reader, field)
    const found = allowed.find((candidate) => candidate === text)
    if (found !== undefined) return found
    if (text !== "") addIssue(reader, field, `expected one of ${allowed.join(", ")}`)
    return allowed[0]
}

/** The items of a list field; empty when the field is missing or is not a list. */
export const itemsOf = (reader: FileReader, field: string): ReadonlyArray<MountItem> => {
    const value: MountValue | undefined = reader.document.fields[field]
    return typeof value === "string" || value === undefined ? [] : value
}

/** The texts of a list field of plain items, trimmed; an item that is an object is an issue. */
export const textListOf = (reader: FileReader, field: string): ReadonlyArray<string> =>
    itemsOf(reader, field).flatMap((item, index) => {
        if (typeof item === "string") return [item.trim()]
        addIssue(reader, `${field}[${index}]`, "expected a text item")
        return []
    })

/** The object items of a list field. */
export const objectListOf = (reader: FileReader, field: string): ReadonlyArray<Readonly<Record<string, string>>> =>
    itemsOf(reader, field).flatMap((item, index) => {
        if (typeof item !== "string") return [item]
        addIssue(reader, `${field}[${index}]`, "expected an item with sub-fields")
        return []
    })
