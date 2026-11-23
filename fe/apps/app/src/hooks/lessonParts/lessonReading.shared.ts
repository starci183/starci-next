import type { ReadingChunkView } from "@starci-next/ui"
import type { LessonView } from "@/modules/types"

/** The section of the practice-led Bản chất reading (`sections/2-essence`): drawn by the reading itself, never as a part's opening prose. */
export const ESSENCE_SECTION_ID = "2-essence"

/** A chapter heading line of markdown (`## 2. 23:58 · …`, level 1 or 2): its level and its text. */
const HEADING = /^(#{1,2})\s+(.+?)\s*#*\s*$/u

/** A fence line (``` or ~~~): headings inside a fence are code, not headings. */
const FENCE = /^\s*(```|~~~)/u

/** The heading number a heading starts with (`2.1.3`), or empty. */
export const numberOf = (title: string): string => /^(\d+(?:\.\d+)*)\.?(?:\s|$)/u.exec(title)?.[1] ?? ""

/** The opening line of a `:::name` container, and a line of colons alone (the closing line of the innermost one). */
const OPENING = /^ {0,3}:{3,}[A-Za-z]/u
const CLOSING = /^ {0,3}:{3,}\s*$/u

/** The opening line of the reading's lab block (`:::lab{title="…"}`): how to pull, start and clean up the lab. */
const LAB_OPENING = /^ {0,3}:{3,}lab\b/u

/**
 * The reading split into its `:::lab` block and the rest: the lines inside the block (without its opening and closing lines) and every
 * other line, so the lab panel and the reading never share a line. A reading with no lab block has an empty lab.
 */
export const labSplitOf = (markdown: string): { readonly lab: string; readonly body: string } => {
    const lab: Array<string> = []
    const body: Array<string> = []
    let depth = 0
    let isFenced = false
    for (const line of markdown.split(/\r?\n/u)) {
        if (depth === 0 && !isFenced && LAB_OPENING.test(line)) {
            depth = 1
            continue
        }
        const isFence = FENCE.test(line)
        if (isFence) isFenced = !isFenced
        if (depth === 0) {
            body.push(line)
            continue
        }
        if (!isFenced && !isFence && OPENING.test(line)) depth += 1
        else if (!isFenced && !isFence && CLOSING.test(line)) depth -= 1
        if (depth > 0) lab.push(line)
    }
    return { lab: lab.join("\n").trim(), body: body.join("\n") }
}

/** The heading text without markdown emphasis marks. */
const plainOf = (title: string): string => title.replaceAll(/[*_`]/gu, "").trim()

/**
 * The reading cut at its chapters, the headings of level 1 and 2 (outside code fences), its `:::lab` block left out: each block is a
 * chapter heading and what follows it (its `###` headings included), the words before the first heading a block of their own titled by
 * the section.
 */
export const chunksOf = (markdown: string, fallbackTitle: string): ReadonlyArray<ReadingChunkView> => {
    const lines = labSplitOf(markdown).body.split(/\r?\n/u)
    const chunks: Array<{ title: string; lines: Array<string> }> = []
    let isFenced = false
    for (const line of lines) {
        if (FENCE.test(line)) isFenced = !isFenced
        const heading = isFenced ? null : HEADING.exec(line)
        if (heading !== null) chunks.push({ title: plainOf(heading[2] ?? ""), lines: [line] })
        else if (chunks.length === 0) chunks.push({ title: fallbackTitle, lines: [line] })
        else chunks.at(-1)?.lines.push(line)
    }
    return chunks
        .map((chunk, index) => ({ id: `essence-${index + 1}`, title: chunk.title, markdown: chunk.lines.join("\n") }))
        .filter((chunk) => chunk.markdown.trim() !== "")
}

/** True when a heading number holds or sits under a section a missed question points at (`2.1` holds `2.1.3`). */
export const isUnder = (heading: string, ref: string): boolean =>
    heading !== "" && ref !== "" && (ref === heading || ref.startsWith(`${heading}.`) || heading.startsWith(`${ref}.`))

/**
 * Where a heading number of the reading (`2.1.3.2`) opens: the Bản chất part at the block that holds or sits under it. Empty when the
 * lesson has no reading, the reading is locked to the reader, or no block carries the number.
 */
export const readingHrefOf = (lesson: LessonView, ref: string, partHref: string): string => {
    const section = lesson.sections.find((each) => each.id === ESSENCE_SECTION_ID)
    if (section === undefined || section.isLocked || ref === "") return ""
    const chunk = chunksOf(section.markdown, section.title).find((each) => isUnder(numberOf(each.title), ref))
    return chunk === undefined ? "" : `${partHref}#${chunk.id}`
}

/** A chapter heading: its number, the time of the night it opens at, and its short title (`2. 23:58 · Giá cũ quay lại sau DEL`). */
const CHAPTER = /^(\d+)\.\s+(?:(\d{1,2}:\d{2})\s*·\s*)?(.+)$/u

/** The unnumbered intro heading (`Mở bài: Đêm Black Friday ở Mây Coffee`, `Opening: …` in English): it carries no number and no time. */
const INTRO = /^(?:Mở bài|Opening)\s*:\s*(.+)$/u

/**
 * The number, the time (empty when the chapter has none), the short title and whether it is the unnumbered intro, of a chapter heading.
 * An intro has no number and no time; its label is the title after the "Mở bài:" mark.
 */
export const chapterPartsOf = (
    title: string,
): { readonly number: string; readonly at: string; readonly label: string; readonly isIntro: boolean } => {
    const intro = INTRO.exec(title)
    if (intro !== null) return { number: "", at: "", label: (intro[1] ?? title).trim(), isIntro: true }
    const match = CHAPTER.exec(title)
    if (match === null) return { number: "", at: "", label: title, isIntro: false }
    return { number: match[1] ?? "", at: match[2] ?? "", label: (match[3] ?? title).trim(), isIntro: false }
}
