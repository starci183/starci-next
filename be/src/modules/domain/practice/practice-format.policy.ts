/** The line that opens and closes a protected value in the teacher's problem files. */
export const PRACTICE_MARKER = "<!-- @starci/seperator -->"

/** A heading and the lines below it, up to the next heading of the same level. */
export interface PracticeBlock {
    /** The heading text. */
    readonly name: string
    /** The lines below the heading, protected values included. */
    readonly lines: ReadonlyArray<string>
}

/** The lines above the first heading and the blocks of one heading level. */
export interface PracticeBlocks {
    /** The lines before the first heading. */
    readonly head: ReadonlyArray<string>
    /** The blocks in file order. */
    readonly blocks: ReadonlyArray<PracticeBlock>
}

const linesOf = (text: string): Array<string> => text.split(/\r?\n/u)

/**
 * Splits lines into the blocks of one heading level (`# `, `## `, `### `). A heading inside a protected value (between two
 * marker lines) is part of the value, never a block of its own.
 */
export const splitBlocks = (lines: ReadonlyArray<string>, level: 1 | 2 | 3): PracticeBlocks => {
    const heading = new RegExp(`^#{${level}} (\\S.*)$`, "u")
    const head: Array<string> = []
    const blocks: Array<{ name: string; lines: Array<string> }> = []
    let protectedValue = false
    for (const line of lines) {
        if (line.trim() === PRACTICE_MARKER) protectedValue = !protectedValue
        const name = protectedValue || line.trim() === PRACTICE_MARKER ? undefined : heading.exec(line)?.[1]?.trim()
        const current = blocks.at(-1)
        if (name !== undefined) blocks.push({ name, lines: [] })
        else if (current === undefined) head.push(line)
        else current.lines.push(line)
    }
    return { head, blocks }
}

/** The blocks of a text at one heading level. */
export const blocksOf = (text: string, level: 1 | 2 | 3): PracticeBlocks => splitBlocks(linesOf(text), level)

/**
 * The value of a block: the lines between its first two marker lines when it has them, otherwise its trimmed text. Leading and
 * trailing blank lines of a protected value are dropped, the lines inside stay exactly as written.
 */
export const valueOf = (lines: ReadonlyArray<string>): string => {
    const first = lines.findIndex((line) => line.trim() === PRACTICE_MARKER)
    const second =
        first === -1 ? -1 : lines.findIndex((line, index) => index > first && line.trim() === PRACTICE_MARKER)
    const inner = first === -1 || second === -1 ? lines : lines.slice(first + 1, second)
    const joined = inner.join("\n")
    return inner === lines ? joined.trim() : joined.replace(/^(?:[ \t]*\n)+/u, "").trimEnd()
}

/** The first block with the name, or undefined. */
export const blockNamed = (blocks: ReadonlyArray<PracticeBlock>, name: string): PracticeBlock | undefined =>
    blocks.find((block) => block.name === name)

/** One step of the hint ladder before it is numbered. */
export interface PracticeHintDraft {
    /** The title the teacher gave the step. */
    readonly title: string
    /** The prose below the title. */
    readonly markdown: string
}

/**
 * Splits the hint into its steps: each `:::muted` block names a step by the line inside it, and the prose runs up to the next
 * `:::muted` block.
 */
export const hintStepsOf = (hint: string): Array<PracticeHintDraft> => {
    const lines = linesOf(hint)
    const steps: Array<{ title: string; body: Array<string> }> = []
    let skip = 0
    lines.forEach((line, index) => {
        if (skip > 0) {
            skip -= 1
            return
        }
        const [title = "", close] = lines.slice(index + 1, index + 3)
        if (line.trim() === ":::muted" && close?.trim() === ":::") {
            steps.push({ title: title.trim(), body: [] })
            skip = 2
            return
        }
        steps.at(-1)?.body.push(line)
    })
    return steps.map((step) => ({ title: step.title, markdown: step.body.join("\n").trim() }))
}
