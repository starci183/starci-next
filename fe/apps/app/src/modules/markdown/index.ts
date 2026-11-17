import type { InlineNode, MarkdownBlock } from "@/modules/types"

/** What a reader step answers: the block it read and the index of the line after it. */
type Read = { readonly block: MarkdownBlock; readonly next: number }

/** The opening mark of the next inline run in `text` from `from`: where it starts and which kind it opens. */
const nextMark = (
    text: string,
    from: number,
): { readonly at: number; readonly kind: "strong" | "code" | "link" } | undefined => {
    const marks = [
        { at: text.indexOf("**", from), kind: "strong" as const },
        { at: text.indexOf("`", from), kind: "code" as const },
        { at: text.indexOf("[", from), kind: "link" as const },
    ].filter((mark) => mark.at >= 0)
    return marks.toSorted((a, b) => a.at - b.at)[0]
}

/** One inline run opened at `at`: its node and the index after its closing mark, or undefined when the mark never closes. */
const readRun = (
    text: string,
    at: number,
    kind: "strong" | "code" | "link",
): { readonly run: Omit<InlineNode, "id">; readonly next: number } | undefined => {
    if (kind === "link") {
        const close = text.indexOf("](", at)
        const end = text.indexOf(")", close)
        if (close < 0 || end < 0) return undefined
        return { run: { kind, text: text.slice(at + 1, close), href: text.slice(close + 2, end) }, next: end + 1 }
    }
    const mark = kind === "strong" ? "**" : "`"
    const end = text.indexOf(mark, at + mark.length)
    if (end < 0) return undefined
    return { run: { kind, text: text.slice(at + mark.length, end), href: "" }, next: end + mark.length }
}

/** The runs of a line of text: plain words with strong words, code spans and links between them. */
const parseInline = (text: string, blockId: string): ReadonlyArray<InlineNode> => {
    const nodes: Array<InlineNode> = []
    const push = (run: Omit<InlineNode, "id">): void => {
        if (run.text !== "") nodes.push({ id: `${blockId}-i${nodes.length}`, ...run })
    }
    let cursor = 0
    let from = 0
    for (let mark = nextMark(text, from); mark !== undefined; mark = nextMark(text, from)) {
        const read = readRun(text, mark.at, mark.kind)
        if (read === undefined) {
            from = mark.at + 1
            continue
        }
        push({ kind: "text", text: text.slice(cursor, mark.at), href: "" })
        push(read.run)
        cursor = read.next
        from = read.next
    }
    push({ kind: "text", text: text.slice(cursor), href: "" })
    return nodes
}

/** A fenced code block read from `lines` starting at `start` (the opening fence). */
const readFence = (lines: ReadonlyArray<string>, start: number, id: string): Read => {
    const language = (lines[start] ?? "").trim().slice(3).trim()
    let end = start + 1
    while (end < lines.length && !(lines[end] ?? "").trim().startsWith("```")) end += 1
    const code = lines.slice(start + 1, end).join("\n")
    const block: MarkdownBlock =
        language === "mermaid" ? { id, kind: "mermaid", source: code } : { id, kind: "code", language, code }
    return { block, next: end + 1 }
}

/** The text of a list item after its marker (`-`, `*`, `1.` or `1)`) and whether it is numbered, or undefined for any other line. */
const listMarker = (line: string): { readonly isOrdered: boolean; readonly text: string } | undefined => {
    const trimmed = line.trimStart()
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) return { isOrdered: false, text: trimmed.slice(2).trim() }
    const digits = trimmed.length - trimmed.replace(/^\d+/, "").length
    const after = trimmed.charAt(digits)
    if (digits > 0 && (after === "." || after === ")") && trimmed.charAt(digits + 1) === " ") {
        return { isOrdered: true, text: trimmed.slice(digits + 2).trim() }
    }
    return undefined
}

/** A list read from `lines` starting at `start`. */
const readList = (lines: ReadonlyArray<string>, start: number, id: string): Read => {
    const first = listMarker(lines[start] ?? "")
    const items: Array<{ readonly id: string; readonly runs: ReadonlyArray<InlineNode> }> = []
    let index = start
    for (let marker = first; marker !== undefined; marker = listMarker(lines[index] ?? "")) {
        const itemId = `${id}-l${items.length}`
        items.push({ id: itemId, runs: parseInline(marker.text, itemId) })
        index += 1
    }
    return { block: { id, kind: "list", isOrdered: first?.isOrdered ?? false, items }, next: index }
}

/** The level of a heading line (2 to 4) and its text, or undefined when the line is not a heading. */
const headingOf = (line: string): { readonly level: 2 | 3 | 4; readonly text: string } | undefined => {
    const trimmed = line.trim()
    const marks = trimmed.length - trimmed.replace(/^#+/, "").length
    if (marks === 0 || marks > 6 || trimmed.charAt(marks) !== " ") return undefined
    const text = trimmed.slice(marks + 1).trim()
    if (marks <= 2) return { level: 2, text }
    return { level: marks === 3 ? 3 : 4, text }
}

/** True when a line starts a block other than a paragraph. */
const startsBlock = (line: string): boolean =>
    line.trim().startsWith("```") ||
    line.trim().startsWith(">") ||
    headingOf(line) !== undefined ||
    listMarker(line) !== undefined

/** A paragraph read from `lines` starting at `start`; a table stays as code. */
const readParagraph = (lines: ReadonlyArray<string>, start: number, id: string): Read => {
    let end = start + 1
    while (end < lines.length && (lines[end] ?? "").trim() !== "" && !startsBlock(lines[end] ?? "")) end += 1
    const text = lines.slice(start, end).join("\n")
    if (text.trimStart().startsWith("|")) return { block: { id, kind: "code", language: "", code: text }, next: end }
    return { block: { id, kind: "paragraph", runs: parseInline(text.replaceAll("\n", " "), id) }, next: end }
}

/** The block that starts at `start`: a fence, a heading, a quote, a list or a paragraph. */
const readBlock = (lines: ReadonlyArray<string>, start: number, id: string): Read => {
    const line = lines[start] ?? ""
    const trimmed = line.trim()
    if (trimmed.startsWith("```")) return readFence(lines, start, id)
    const heading = headingOf(line)
    if (heading !== undefined) return { block: { id, kind: "heading", ...heading }, next: start + 1 }
    if (trimmed.startsWith(">"))
        return { block: { id, kind: "quote", runs: parseInline(trimmed.slice(1).trim(), id) }, next: start + 1 }
    if (listMarker(line) !== undefined) return readList(lines, start, id)
    return readParagraph(lines, start, id)
}

/** The body without its HTML comments (the teacher's separators and notes). */
const withoutComments = (body: string): string => {
    const open = body.indexOf("<!--")
    const close = body.indexOf("-->", open)
    if (open < 0 || close < 0) return body
    return withoutComments(body.slice(0, open) + body.slice(close + 3))
}

/**
 * Reads a lesson body into blocks: headings, paragraphs, lists, quotes, fenced code and Mermaid diagrams. A table stays as a
 * code block and an HTML comment is dropped. This is the fallback reader until the stack's markdown renderer (react-markdown)
 * is installed (stack/fe.yaml `markdown`).
 */
export const parseMarkdown = (body: string): ReadonlyArray<MarkdownBlock> => {
    const lines = withoutComments(body).split(/\r?\n/)
    const blocks: Array<MarkdownBlock> = []
    let index = 0
    while (index < lines.length) {
        if ((lines[index] ?? "").trim() === "") {
            index += 1
            continue
        }
        const read = readBlock(lines, index, `b${blocks.length}`)
        blocks.push(read.block)
        index = read.next
    }
    return blocks
}
