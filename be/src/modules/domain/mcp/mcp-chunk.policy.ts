import type { Chunk } from "./mcp-embedding.policy"

/** The most characters one chunk holds; a longer part is cut at a blank line (or a line) into pieces of at most this size. */
export const CHUNK_CHARS_MAX = 3000
/** A part shorter than this is joined to its neighbour, so a heading with one line or a constant is not a chunk of its own. */
const CHUNK_CHARS_MIN = 240
/** A file at most this long is one chunk. */
const WHOLE_FILE_CHARS = 1800

/** A half-open range of line indexes (0-based) of a text. */
interface Span {
    readonly from: number
    readonly to: number
}

/** A span with the title it sits under. */
interface Titled extends Span {
    readonly title: string | null
}

const linesOf = (text: string): Array<string> => text.split(/\r?\n/u)

const charsOf = (lines: ReadonlyArray<string>, span: Span): number => {
    let total = 0
    for (let index = span.from; index < span.to; index += 1) total += (lines[index]?.length ?? 0) + 1
    return total
}

/** The span without its blank first and last lines; null when nothing is left. */
const trimmed = (lines: ReadonlyArray<string>, span: Span): Span | null => {
    let from = span.from
    let to = span.to
    while (from < to && (lines[from] ?? "").trim() === "") from += 1
    while (to > from && (lines[to - 1] ?? "").trim() === "") to -= 1
    return from < to ? { from, to } : null
}

/**
 * Cuts a span into pieces of at most `CHUNK_CHARS_MAX` characters: at a blank line when the piece is at least half full, else at
 * the line that would overflow it. A single line longer than the bound is cut in the middle so no piece ever exceeds it.
 */
const piecesOf = (lines: ReadonlyArray<string>, span: Span): Array<Span> => {
    const pieces: Array<Span> = []
    let from = span.from
    let size = 0
    let lastBlank = -1
    for (let index = span.from; index < span.to; index += 1) {
        const line = lines[index] ?? ""
        if (size + line.length + 1 > CHUNK_CHARS_MAX && index > from) {
            const cut =
                lastBlank > from && charsOf(lines, { from, to: lastBlank }) >= CHUNK_CHARS_MAX / 2 ? lastBlank : index
            pieces.push({ from, to: cut })
            from = cut
            size = charsOf(lines, { from, to: index })
            lastBlank = -1
        }
        size += line.length + 1
        if (line.trim() === "") lastBlank = index + 1
    }
    if (from < span.to) pieces.push({ from, to: span.to })
    return pieces.flatMap((piece) => trimmed(lines, piece) ?? [])
}

const textOf = (lines: ReadonlyArray<string>, span: Span): string => lines.slice(span.from, span.to).join("\n")

/** Builds the chunks of titled spans, cutting an over-long span and naming the pieces `(k/n)`. */
const chunksOfSpans = (path: string, lines: ReadonlyArray<string>, spans: ReadonlyArray<Titled>): Array<Chunk> =>
    spans.flatMap((titled) => {
        const inside = trimmed(lines, titled)
        if (inside === null) return []
        const parts = charsOf(lines, inside) > CHUNK_CHARS_MAX ? piecesOf(lines, inside) : [inside]
        return parts.map((part, index): Chunk => {
            const title =
                titled.title === null
                    ? null
                    : parts.length > 1
                      ? `${titled.title} (${index + 1}/${parts.length})`
                      : titled.title
            const body = textOf(lines, part).slice(0, CHUNK_CHARS_MAX)
            return {
                path,
                line: part.from + 1,
                lineEnd: part.to,
                title,
                context: title === null ? path : `${path} · ${title}`,
                text: body,
            }
        })
    })

/** The title of two joined spans: the longer trail when one extends the other, else both. */
const joinedTitle = (first: string | null, second: string | null, glue: string): string | null => {
    if (first === null || first === second) return second ?? first
    if (second === null) return first
    return second.startsWith(first) ? second : `${first}${glue}${second}`
}

/** Joins neighbouring spans that are shorter than the minimum into one span (titles joined), without crossing the maximum. */
const joinedSmall = (lines: ReadonlyArray<string>, spans: ReadonlyArray<Titled>, glue: string): Array<Titled> => {
    const out: Array<Titled> = []
    let pending: Titled | null = null
    const flush = (): void => {
        if (pending !== null) out.push(pending)
        pending = null
    }
    for (const span of spans) {
        const size = charsOf(lines, span)
        if (pending === null) {
            pending = span
        } else if (charsOf(lines, pending) < CHUNK_CHARS_MIN && charsOf(lines, pending) + size <= CHUNK_CHARS_MAX) {
            pending = {
                from: pending.from,
                to: span.to,
                title: joinedTitle(pending.title, span.title, glue),
            }
        } else {
            flush()
            pending = span
        }
    }
    flush()
    return out
}

/** The heading a markdown line opens (`## Title` gives level 2), or null; fenced code is the caller's concern. */
const headingOf = (line: string): { readonly level: number; readonly text: string } | null => {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/u.exec(line)
    const hashes = match?.[1]
    const text = match?.[2]
    return hashes === undefined || text === undefined ? null : { level: hashes.length, text }
}

/** The opening or closing of a fenced code block (three backticks or three tildes) on a line, or null. */
const fenceOf = (line: string): string | null => /^\s{0,3}(`{3,}|~{3,})/u.exec(line)?.[1]?.[0] ?? null

/** One heading of a markdown text, for the table of contents of a section. */
export interface MarkdownHeading {
    /** The level, 1 for `#`. */
    readonly level: number
    /** The heading text. */
    readonly title: string
    /** The 1-based line. */
    readonly line: number
}

/** The headings of a markdown text outside fenced code, in order. */
export const headingsOf = (text: string): Array<MarkdownHeading> => {
    const found: Array<MarkdownHeading> = []
    let fence: string | null = null
    linesOf(text).forEach((line, index) => {
        const mark = fenceOf(line)
        if (mark !== null) fence = fence === null ? mark : fence === mark ? null : fence
        const heading = fence === null && mark === null ? headingOf(line) : null
        if (heading !== null) found.push({ level: heading.level, title: heading.text, line: index + 1 })
    })
    return found
}

/**
 * Cuts markdown by heading: one chunk per heading section, titled by its trail (`1 Essence > 1.2 Why`), a heading with a line
 * of text joined to the next section, an over-long section cut at blank lines into pieces, a `#` inside fenced code never a
 * heading. Every chunk keeps its 1-based first and last line in the text.
 */
export const markdownChunksOf = (path: string, text: string): Array<Chunk> => {
    const lines = linesOf(text)
    const sections: Array<Titled> = []
    const trail: Array<{ readonly level: number; readonly text: string }> = []
    let fence: string | null = null
    let start = 0
    let title: string | null = null
    const close = (end: number): void => {
        if (end > start) sections.push({ from: start, to: end, title })
    }
    lines.forEach((line, index) => {
        const mark = fenceOf(line)
        if (mark !== null) fence = fence === null ? mark : fence === mark ? null : fence
        const heading = fence === null && mark === null ? headingOf(line) : null
        if (heading === null) return
        close(index)
        while ((trail[trail.length - 1]?.level ?? 0) >= heading.level) trail.pop()
        trail.push(heading)
        start = index
        title = trail.map((item) => item.text).join(" > ")
    })
    close(lines.length)
    return chunksOfSpans(path, lines, joinedSmall(lines, sections, " | "))
}

/** The file names whose content is generated noise for a search: they stay readable but are never indexed or searched. */
const LOCKFILES: ReadonlySet<string> = new Set([
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "npm-shrinkwrap.json",
])

/** True for a file a search skips (a lock file): it can still be read. */
export const isSearchNoise = (path: string): boolean => LOCKFILES.has(path.split("/").pop() ?? "")

/** A top-level declaration of a script, at column 0. */
const DECLARATION =
    /^(?:export\s+)?(?:default\s+)?(?:declare\s+)?(?:abstract\s+)?(?:async\s+)?(function\*?|class|interface|type|enum|namespace|const|let|var)\s+([A-Za-z_$][\w$]*)/u
/** A top-level test block of a spec, at column 0. */
const TEST_BLOCK = /^(describe|it|test)(?:\.\w+)?\(\s*(["'`])(.*?)\2/u
/** A member of a class body, at the body's indentation. */
const MEMBER =
    /^(?:(?:public|private|protected|static|async|readonly|get|set|override|abstract)\s+)*([A-Za-z_$#][\w$]*)\s*[(<=:?!]/u
const SCRIPT_EXTENSION = /\.(?:[cm]?[jt]sx?)$/u
const MARKDOWN_EXTENSION = /\.(?:md|mdx)$/u

/** The start of the comment and decorator lines directly above a declaration, so they stay with it. */
const withLeadingTrivia = (lines: ReadonlyArray<string>, at: number, floor: number): number => {
    let start = at
    while (start > floor && /^\s*(?:\/\/|\/\*|\*|@)/u.test(lines[start - 1] ?? "")) start -= 1
    return start
}

/** The declarations of a script at column 0 with the title each opens, in order. */
const declarationsOf = (lines: ReadonlyArray<string>): Array<{ readonly at: number; readonly title: string }> => {
    const found: Array<{ readonly at: number; readonly title: string }> = []
    lines.forEach((line, index) => {
        const declaration = DECLARATION.exec(line)
        if (declaration !== null) {
            found.push({ at: index, title: `${declaration[1] ?? ""} ${declaration[2] ?? ""}`.trim() })
            return
        }
        const block = TEST_BLOCK.exec(line)
        if (block !== null) found.push({ at: index, title: `${block[1] ?? ""} ${block[3] ?? ""}`.trim() })
    })
    return found
}

/** Cuts an over-long class into groups of its members, titled `Class.member`. */
const membersOf = (lines: ReadonlyArray<string>, span: Span, owner: string): Array<Titled> => {
    const first = lines.findIndex(
        (line, index) =>
            index > span.from && index < span.to && line.trim() !== "" && !/^\s*(?:\/\/|\/\*|\*)/u.test(line),
    )
    if (first < 0) return [{ ...span, title: owner }]
    const indent = (lines[first] ?? "").length - (lines[first] ?? "").trimStart().length
    const starts: Array<{ readonly at: number; readonly name: string }> = []
    for (let index = first; index < span.to; index += 1) {
        const line = lines[index] ?? ""
        if (line.length - line.trimStart().length !== indent) continue
        const member = MEMBER.exec(line.trimStart())
        const name = member?.[1]
        if (name !== undefined && !["return", "if", "for", "while", "switch", "throw", "else"].includes(name))
            starts.push({ at: withLeadingTrivia(lines, index, first), name })
    }
    if (starts.length === 0) return [{ ...span, title: owner }]
    const parts: Array<Titled> = [{ from: span.from, to: starts[0]?.at ?? span.to, title: owner }]
    starts.forEach((start, position) => {
        parts.push({ from: start.at, to: starts[position + 1]?.at ?? span.to, title: `${owner}.${start.name}` })
    })
    return joinedSmall(lines, parts, ", ")
}

/** The chunks of a script: its header, then one chunk per top-level declaration, a class cut by member when it is long. */
const scriptChunksOf = (path: string, lines: ReadonlyArray<string>): Array<Chunk> => {
    const declarations = declarationsOf(lines)
    const first = declarations[0]
    if (first === undefined) return chunksOfSpans(path, lines, [{ from: 0, to: lines.length, title: null }])
    const starts = declarations.map((declaration, position) => ({
        ...declaration,
        at: withLeadingTrivia(lines, declaration.at, position === 0 ? 0 : (declarations[position - 1]?.at ?? 0) + 1),
    }))
    const spans: Array<Titled> = []
    const head = starts[0]?.at ?? 0
    if (head > 0) spans.push({ from: 0, to: head, title: "header" })
    starts.forEach((start, position) => {
        const span = { from: start.at, to: starts[position + 1]?.at ?? lines.length }
        if (start.title.startsWith("class ") && charsOf(lines, span) > CHUNK_CHARS_MAX)
            spans.push(...membersOf(lines, span, start.title.replace(/^class\s+/u, "")))
        else spans.push({ ...span, title: start.title })
    })
    return chunksOfSpans(path, lines, joinedSmall(lines, spans, ", "))
}

/** The chunks of a file that is neither script nor markdown: windows cut at blank lines, titled by the file. */
const plainChunksOf = (path: string, lines: ReadonlyArray<string>): Array<Chunk> => {
    const name = path.split("/").pop() ?? path
    const pieces = piecesOf(lines, { from: 0, to: lines.length })
    return chunksOfSpans(
        path,
        lines,
        pieces.map((span, index) => ({
            ...span,
            title: pieces.length > 1 ? `${name} (${index + 1}/${pieces.length})` : name,
        })),
    )
}

/**
 * Cuts one source file for search: markdown by heading, a script by file and symbol (its header, then each top-level function,
 * class, type, constant or test block, a long class by member), anything else in windows at blank lines; a short file is one
 * chunk. Every chunk carries its path, its symbol and its 1-based line range, and a lock file gives none.
 */
export const codeChunksOf = (path: string, text: string): Array<Chunk> => {
    if (isSearchNoise(path) || text.trim() === "") return []
    const lines = linesOf(text)
    if (MARKDOWN_EXTENSION.test(path)) return markdownChunksOf(path, text)
    if (text.length <= WHOLE_FILE_CHARS)
        return chunksOfSpans(path, lines, [{ from: 0, to: lines.length, title: path.split("/").pop() ?? path }])
    return SCRIPT_EXTENSION.test(path) ? scriptChunksOf(path, lines) : plainChunksOf(path, lines)
}
