import { createHash } from "node:crypto"
import { LessonContentError, LessonContentErrorCode } from "./errors/lesson-content.error"
import type { ByteRange } from "./lesson-content.contracts"

const SEPARATOR = "<!-- @starci/seperator -->"
const HEADING = /^(#{1,6}) (.+)$/
const LINE_FEED = 0x0a
const INTEGER = /^\d+$/

/** One line of a raw file with its byte range, end exclusive and including the line ending. */
export interface DocumentLine extends ByteRange {
    /** The line text without its CR or LF ending. */
    readonly text: string
}

/** One heading of an Academy document: a container of headings or a leaf whose value sits between two separators. */
export interface DocumentNode {
    /** The level of this DocumentNode. */
    readonly level: number
    /** The name of this DocumentNode. */
    readonly name: string
    /** The value of this DocumentNode. */
    readonly value: ByteRange | null
    /** The children of this DocumentNode. */
    readonly children: Array<DocumentNode>
}

const malformed = (reason: string, at: number): LessonContentError =>
    new LessonContentError({ code: LessonContentErrorCode.SourceMalformed, params: { reason, line: at } })

/** The SHA-256 hex digest of a raw byte slice, the one hash every manifest and file check compares. */
export const sha256Hex = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex")

/** Splits raw bytes into lines with exact byte offsets, so a range is always a slice of the original bytes. */
export const splitLines = (raw: Uint8Array): Array<DocumentLine> => {
    const buffer = Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength)
    const lines: Array<DocumentLine> = []
    let start = 0
    while (start < buffer.length) {
        const found = buffer.indexOf(LINE_FEED, start)
        const end = found === -1 ? buffer.length : found + 1
        const text = buffer.toString("utf8", start, end).replace(/\r?\n$/, "")
        lines.push({ start, end, text })
        start = end
    }
    return lines
}

/** The text of a byte range of a raw file. */
export const textOf = (raw: Uint8Array, range: ByteRange): string =>
    Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength).toString("utf8", range.start, range.end)

/** The raw bytes of a byte range of a raw file. */
export const bytesOf = (raw: Uint8Array, range: ByteRange): Uint8Array => raw.subarray(range.start, range.end)

const attach = (stack: Array<DocumentNode>, roots: Array<DocumentNode>, node: DocumentNode): void => {
    let top = stack[stack.length - 1]
    while (top !== undefined && top.level >= node.level) {
        stack.pop()
        top = stack[stack.length - 1]
    }
    const parent = stack[stack.length - 1]
    if (parent === undefined) roots.push(node)
    else parent.children.push(node)
    stack.push(node)
}

/**
 * Reads the Academy separator structure: a heading followed by a separator is a leaf whose value runs to the next
 * separator and may itself contain headings; a heading followed by another heading is a container.
 */
export const parseAcademyDocument = (raw: Uint8Array): Array<DocumentNode> => {
    const lines = splitLines(raw)
    const roots: Array<DocumentNode> = []
    const stack: Array<DocumentNode> = []
    let consumed = -1
    for (const [at, line] of lines.entries()) {
        if (at <= consumed) continue
        if (line.text.trim() === "") continue
        const match = HEADING.exec(line.text)
        if (match === null) throw malformed("expected a heading", at + 1)
        const node: DocumentNode = {
            level: String(match[1]).length,
            name: String(match[2]).trim(),
            value: null,
            children: [],
        }
        attach(stack, roots, node)
        const opening = lines[at + 1]
        if (opening?.text !== SEPARATOR) continue
        let closing = at + 2
        while (closing < lines.length && lines[closing]?.text !== SEPARATOR) closing += 1
        const closingLine = lines[closing]
        if (closingLine === undefined) throw malformed("a value is not closed by a separator", at + 1)
        Object.assign(node, { value: { start: opening.end, end: closingLine.start } })
        consumed = closing
    }
    return roots
}

/** The child heading of a node by name, or null. */
export const childNamed = (nodes: ReadonlyArray<DocumentNode>, name: string): DocumentNode | null =>
    nodes.find((node) => node.name === name) ?? null

/** The child heading of a node by name; a missing one is a malformed source. */
export const requiredChild = (nodes: ReadonlyArray<DocumentNode>, name: string): DocumentNode => {
    const node = childNamed(nodes, name)
    if (node === null) throw malformed(`missing section ${name}`, 0)
    return node
}

/** The container child of a node by name; a missing or leaf child is a malformed source. */
export const containerNamed = (nodes: ReadonlyArray<DocumentNode>, name: string): DocumentNode => {
    const node = requiredChild(nodes, name)
    if (node.value !== null) throw malformed(`expected a container for ${name}`, 0)
    return node
}

/** The children of a container whose names are decimal ordinals, sorted numerically; a non-numeric name is malformed. */
export const numberedChildren = (node: DocumentNode): Array<DocumentNode> => {
    const children = [...node.children]
    if (!children.every((child) => INTEGER.test(child.name))) throw malformed("expected numbered children", 0)
    children.sort((left, right) => Number.parseInt(left.name, 10) - Number.parseInt(right.name, 10))
    return children
}

/** The leaf value of a named heading, trimmed; a missing or non-leaf heading is a malformed source. */
export const leafText = (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>, name: string): string => {
    const node = childNamed(nodes, name)
    if (node?.value === null || node === null) throw malformed(`missing value for ${name}`, 0)
    return textOf(raw, node.value).trim()
}

/** The leaf value of a named heading as a non-negative integer; anything else is a malformed source. */
export const leafInt = (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>, name: string): number => {
    const text = leafText(raw, nodes, name)
    if (!INTEGER.test(text)) throw malformed(`expected an integer for ${name}`, 0)
    return Number.parseInt(text, 10)
}

/** The leaf value of a named heading as a boolean written `true` or `false`; anything else is a malformed source. */
export const leafBool = (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>, name: string): boolean => {
    const text = leafText(raw, nodes, name)
    if (text !== "true" && text !== "false") throw malformed(`expected a boolean for ${name}`, 0)
    return text === "true"
}

/** The leaf value of a named heading when present, else null; a non-leaf child is a malformed source. */
export const leafTextOrNull = (raw: Uint8Array, nodes: ReadonlyArray<DocumentNode>, name: string): string | null => {
    const node = childNamed(nodes, name)
    if (node === null) return null
    if (node.value === null) throw malformed(`expected a value for ${name}`, 0)
    return textOf(raw, node.value).trim()
}

/** The names the node list carries that are not in the allowed set; the caller turns them into a refusal. */
export const unknownNames = (nodes: ReadonlyArray<DocumentNode>, allowed: ReadonlyArray<string>): Array<string> =>
    nodes.filter((node) => !allowed.includes(node.name)).map((node) => node.name)
