/** The line that opens and closes the value of one field in a `@starci/seperator` file. */
export const DECK_SEPARATOR = "<!-- @starci/seperator -->"

const FIELD = /^# ([A-Za-z][A-Za-z0-9]*)$/u

const ITEM = /^## (\d+)$/u

/** The fields of a deck or card file and what was wrong with its layout. */
export interface DeckFields {
    /** The value of each plain field by name, exactly as written between its two marker lines. */
    readonly fields: Readonly<Record<string, string>>
    /** The values of each list field (`# tags` then `## 0`, `## 1`) in item order. */
    readonly lists: Readonly<Record<string, ReadonlyArray<string>>>
    /** The layout problems, in the order they appear; empty for a well-formed file. */
    readonly problems: ReadonlyArray<string>
}

/** The scan state: where the reader is, the field and list item it is in and the lines of that value. */
interface Scan {
    mode: "outside" | "expect" | "value"
    name: string
    item: number | null
    lines: Array<string>
    readonly fields: Record<string, string>
    readonly lists: Record<string, Array<string>>
    readonly problems: Array<string>
}

const outside = (scan: Scan, line: string, at: string): void => {
    const trimmed = line.trim()
    if (trimmed === "") return
    const field = FIELD.exec(trimmed)?.[1]
    const item = ITEM.exec(trimmed)?.[1]
    if (field !== undefined) {
        scan.name = field
        scan.item = null
        scan.mode = "expect"
    } else if (item !== undefined && scan.name !== "") {
        scan.item = Number(item)
        scan.mode = "expect"
    } else scan.problems.push(`${at}: text outside a field`)
}

const expectSeparator = (scan: Scan, line: string, at: string): void => {
    const trimmed = line.trim()
    const item = ITEM.exec(trimmed)?.[1]
    if (trimmed === DECK_SEPARATOR) {
        scan.mode = "value"
        scan.lines = []
    } else if (item !== undefined && scan.item === null) scan.item = Number(item)
    else {
        scan.problems.push(`${at}: field ${scan.name} does not start with the separator line`)
        scan.mode = "outside"
    }
}

const close = (scan: Scan): void => {
    const value = scan.lines.join("\n")
    if (scan.item === null) scan.fields[scan.name] = value
    else {
        const list = scan.lists[scan.name] ?? []
        list[scan.item] = value
        scan.lists[scan.name] = list
    }
    scan.mode = "outside"
}

/**
 * Reads the field format of the deck and card files (mount V1): `# name`, the marker line, the value, the marker line; a list
 * field is `# name` with `## n` before each marker pair. A `# ` line inside a value is part of the value. Text between fields
 * and a field that is not closed are problems, never silently skipped.
 */
export const parseDeckFields = (text: string): DeckFields => {
    const scan: Scan = { mode: "outside", name: "", item: null, lines: [], fields: {}, lists: {}, problems: [] }
    text.split(/\r?\n/u).forEach((line, index) => {
        const at = `line ${index + 1}`
        if (scan.mode === "value") {
            if (line.trim() === DECK_SEPARATOR) close(scan)
            else scan.lines.push(line)
        } else if (scan.mode === "expect") expectSeparator(scan, line, at)
        else outside(scan, line, at)
    })
    if (scan.mode !== "outside") scan.problems.push(`field ${scan.name} is not closed by the separator line`)
    return {
        fields: scan.fields,
        lists: Object.fromEntries(Object.entries(scan.lists).map(([name, values]) => [name, [...values]])),
        problems: scan.problems,
    }
}
