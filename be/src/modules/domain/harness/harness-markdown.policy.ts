import { parse } from "yaml"
import { isRecord } from "@modules/platform/primitives"

/** The id of a heading anchor and of a stage, step, section or probe. */
export const HARNESS_ID = /^[a-z0-9][a-z0-9-]{0,63}$/u

const ANCHORED = /^(#{1,6})\s+(.+?)\s*\{#([a-z0-9][a-z0-9-]{0,63})\}\s*$/u
const FENCE = /^(`{3,}|~{3,})\s*([A-Za-z0-9_-]*)\s*$/u

/** A markdown file split into its front matter and its text. */
export interface MarkdownDocument {
    /** The front matter keys, empty when there is none. */
    readonly meta: Readonly<Record<string, unknown>>
    /** The text after the front matter. */
    readonly body: string
}

/** One anchored section: the heading's title and id and the text under it up to the next heading of the same or a higher level. */
export interface MarkdownSection {
    /** The anchor id. */
    readonly id: string
    /** The heading text without the anchor. */
    readonly title: string
    /** The text under the heading, trimmed. */
    readonly body: string
}

/** Splits the front matter (`---` fenced yaml at the very start) from the text; an unreadable front matter is empty. */
export const documentOf = (text: string): MarkdownDocument => {
    const normal = text.replace(/\r\n/gu, "\n")
    const match = /^---\n([\s\S]*?)\n---\n?/u.exec(normal)
    if (match === null) return { meta: {}, body: normal }
    try {
        const meta: unknown = parse(match[1] ?? "")
        return { meta: isRecord(meta) ? meta : {}, body: normal.slice(match[0].length) }
    } catch {
        return { meta: {}, body: normal.slice(match[0].length) }
    }
}

/** The heading `# Title` of the first level-one heading outside code, or null. */
export const firstTitleOf = (body: string): string | null => {
    let fence: string | null = null
    for (const line of body.split("\n")) {
        const marker = FENCE.exec(line)
        if (marker !== null) fence = fence === null ? (marker[1] ?? "") : line.startsWith(fence) ? null : fence
        if (fence === null && /^#\s+\S/u.test(line))
            return line
                .replace(/^#\s+/u, "")
                .replace(/\s*\{#[^}]*\}\s*$/u, "")
                .trim()
    }
    return null
}

/**
 * The anchored headings of one level, in order, with the text under each: a heading line outside code fences that ends with
 * `{#id}`. Text before the first heading and unanchored headings of the level belong to no section (an unanchored heading ends the
 * section above it).
 */
export const sectionsOf = (body: string, level: number): ReadonlyArray<MarkdownSection> => {
    const found: Array<{ id: string; title: string; lines: Array<string> }> = []
    let fence: string | null = null
    for (const line of body.split("\n")) {
        const marker = FENCE.exec(line)
        if (marker !== null) fence = fence === null ? (marker[1] ?? "") : line.startsWith(fence) ? null : fence
        const heading = fence === null && marker === null ? ANCHORED.exec(line) : null
        if (heading !== null && (heading[1]?.length ?? 0) === level) {
            found.push({ id: heading[3] ?? "", title: heading[2] ?? "", lines: [] })
            continue
        }
        const plain = fence === null && marker === null ? /^(#{1,6})\s+\S/u.exec(line) : null
        if (plain !== null && (plain[1]?.length ?? 7) <= level) {
            found.push({ id: "", title: "", lines: [] })
            continue
        }
        found[found.length - 1]?.lines.push(line)
    }
    return found
        .filter((section) => section.id !== "")
        .map((section) => ({ id: section.id, title: section.title, body: section.lines.join("\n").trim() }))
}

/** The fenced blocks tagged `run`, each as its trimmed text. */
export const runBlocksOf = (body: string): ReadonlyArray<string> => {
    const blocks: Array<string> = []
    let current: Array<string> | null = null
    let fence = ""
    for (const line of body.split("\n")) {
        const marker = FENCE.exec(line)
        if (current === null) {
            if (marker !== null && marker[2] === "run") {
                current = []
                fence = marker[1] ?? "```"
            }
            continue
        }
        if (line.startsWith(fence) && line.trim() === fence) {
            const text = current.join("\n").trim()
            if (text !== "") blocks.push(text)
            current = null
            continue
        }
        current.push(line)
    }
    return blocks
}
