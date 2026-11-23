/** One piece of a markdown source: plain markdown, or a `:::name` container with its own pieces inside. */
export type RichNode = MarkdownPiece | DirectivePiece

/** A run of plain markdown. */
export type MarkdownPiece = { readonly id: string; readonly kind: "markdown"; readonly source: string }

/** A `:::name` container and the pieces inside it. */
export type DirectivePiece = {
    readonly id: string
    readonly kind: "directive"
    /** The word after the colons (`accordion`, `panel`, `muted`). */
    readonly name: string
    /** The text in square brackets after the name, or an empty string. */
    readonly label: string
    /** The `key="value"` pairs in braces after the name. */
    readonly attrs: Readonly<Record<string, string>>
    /** The pieces between the opening line and the closing line. */
    readonly inside: ReadonlyArray<RichNode>
}

/** The head of an opening line: the name, the label and the pairs. */
type Opening = { readonly name: string; readonly label: string; readonly attrs: Readonly<Record<string, string>> }

/** A container that is still open while the lines are read. */
type Frame = Opening & { readonly nodes: Array<RichNode>; readonly lines: Array<string> }

/** The name of a container: a letter, then letters, digits, dashes or underscores. */
const NAME = /^[A-Za-z][\w-]*/u

/** The value at the start of `text`: quoted (up to the closing quote) or a run up to the next space, and what follows it. */
const valueOf = (text: string): { readonly value: string; readonly rest: string } => {
    const quote = text.charAt(0)
    const end = quote === '"' || quote === "'" ? text.indexOf(quote, 1) : -1
    if (end > 0) return { value: text.slice(1, end), rest: text.slice(end + 1) }
    const space = text.search(/\s/u)
    return space < 0 ? { value: text, rest: "" } : { value: text.slice(0, space), rest: text.slice(space) }
}

/** The `key="value"` pairs of the text between braces. */
const attrsOf = (text: string): Readonly<Record<string, string>> => {
    const attrs: Record<string, string> = {}
    let rest = text.trim()
    for (let eq = rest.indexOf("="); eq > 0; eq = rest.indexOf("=")) {
        const read = valueOf(rest.slice(eq + 1))
        attrs[rest.slice(0, eq).trim().split(/\s+/u).at(-1) ?? ""] = read.value
        rest = read.rest.trim()
    }
    return attrs
}

/** The text between `open` and `close` at the start of `text`, and what follows it; an empty text and all of `text` when it does not start with `open`. */
const enclosed = (text: string, open: string, close: string): { readonly inner: string; readonly rest: string } => {
    const end = text.startsWith(open) ? text.indexOf(close) : -1
    if (end < 0) return { inner: "", rest: text }
    return { inner: text.slice(open.length, end), rest: text.slice(end + close.length).trimStart() }
}

/** The colons at the start of a line indented by at most three spaces and what follows them, or undefined when the line has fewer than three. */
const colonsOf = (line: string): { readonly count: number; readonly after: string } | undefined => {
    const trimmed = line.trimStart()
    if (line.length - trimmed.length > 3) return undefined
    const after = trimmed.replace(/^:+/u, "")
    const count = trimmed.length - after.length
    return count < 3 ? undefined : { count, after: after.trim() }
}

/** The head of an opening line (`:::name[label]{key="value"}`), or undefined when the line is not one. */
const openingOf = (line: string): Opening | undefined => {
    const colons = colonsOf(line)
    const name = colons === undefined ? undefined : NAME.exec(colons.after)?.[0]
    if (colons === undefined || name === undefined) return undefined
    const labelled = enclosed(colons.after.slice(name.length), "[", "]")
    const paired = enclosed(labelled.rest, "{", "}")
    return paired.rest === "" ? { name, label: labelled.inner, attrs: attrsOf(paired.inner) } : undefined
}

/** True for a line of colons alone, the closing line of the innermost container. */
const isClosing = (line: string): boolean => colonsOf(line)?.after === ""

/** The mark a line opens or closes a fenced code block with (a run of backticks or tildes), or an empty string. */
const fenceOf = (line: string): string => /^ {0,3}(`{3,}|~{3,})/u.exec(line)?.[1] ?? ""

/** The fence still open after a line: the one it opens, or none when it closes the open one. */
const fenceAfter = (line: string, fence: string): string => {
    const mark = fenceOf(line)
    if (mark === "") return fence
    if (fence === "") return mark
    return mark.startsWith(fence.charAt(0)) && mark.length >= fence.length ? "" : fence
}

/** Moves the plain lines read so far into the frame as one markdown piece. */
const flush = (frame: Frame, id: string): void => {
    const source = frame.lines.join("\n").trim()
    frame.lines.length = 0
    if (source !== "") frame.nodes.push({ id: `${id}-m${frame.nodes.length}`, kind: "markdown", source })
}

/** Closes the innermost frame into its parent. */
const closeInnermost = (stack: Array<Frame>): void => {
    const frame = stack.pop()
    const parent = stack.at(-1)
    if (frame === undefined || parent === undefined) return
    flush(frame, `d${parent.nodes.length}`)
    parent.nodes.push({
        id: `d${parent.nodes.length}`,
        kind: "directive",
        name: frame.name,
        label: frame.label,
        attrs: frame.attrs,
        inside: frame.nodes,
    })
}

/**
 * Reads a markdown source into plain markdown pieces and `:::name` containers (the directive syntax of the lesson, practice and
 * review texts). A container opens on `:::name[label]{key="value"}` and closes on a line of colons alone, the innermost first, so
 * `::::accordion` may hold `:::panel` containers that hold `:::muted` ones. Lines inside a fenced code block are never read as
 * directives, a closing line with nothing open is dropped and a container left open at the end closes there.
 */
export const parseDirectives = (source: string): ReadonlyArray<RichNode> => {
    const stack: Array<Frame> = [{ name: "", label: "", attrs: {}, nodes: [], lines: [] }]
    let fence = ""
    for (const line of source.replaceAll("\r\n", "\n").split("\n")) {
        const top = stack.at(-1) ?? stack[0]
        if (top === undefined) break
        const opening = fence === "" ? openingOf(line) : undefined
        fence = fenceAfter(line, fence)
        if (opening !== undefined) {
            flush(top, `r${top.nodes.length}`)
            stack.push({ ...opening, nodes: [], lines: [] })
        } else if (fence === "" && isClosing(line)) {
            if (stack.length > 1) closeInnermost(stack)
        } else {
            top.lines.push(line)
        }
    }
    while (stack.length > 1) closeInnermost(stack)
    const root = stack[0]
    if (root === undefined) return []
    flush(root, "r")
    return root.nodes
}

/** The words of a piece list as plain text: markdown marks of bold and code dropped, for a one-line muted caption. */
export const plainWordsOf = (nodes: ReadonlyArray<RichNode>): string =>
    nodes
        .map((node) => (node.kind === "markdown" ? node.source : plainWordsOf(node.inside)))
        .join(" ")
        .replaceAll(/[*_`]+/gu, "")
        .replaceAll(/\s+/gu, " ")
        .trim()
