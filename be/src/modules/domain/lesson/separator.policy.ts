/** The line that opens and closes the value of one field in a `@starci/seperator` file. */
export const SEPARATOR_MARKER = "<!-- @starci/seperator -->"

const HEADER = /^# ([A-Za-z][A-Za-z0-9]*)$/u

/** The fields of a separator file and what was wrong with its layout. */
export interface SeparatorFields {
    /** The value of each field by name, exactly as written between its two marker lines. */
    readonly fields: Readonly<Record<string, string>>
    /** The layout problems, in the order they appear; empty for a well-formed file. */
    readonly problems: ReadonlyArray<string>
}

/** The scan state: where the reader is, the field it is in and the lines of that field value. */
interface Scan {
    mode: "outside" | "expect" | "value"
    name: string
    lines: Array<string>
    readonly fields: Record<string, string>
    readonly problems: Array<string>
}

const outside = (scan: Scan, line: string, at: string): void => {
    const trimmed = line.trim()
    if (trimmed === "") return
    const name = HEADER.exec(trimmed)?.[1]
    if (name === undefined) scan.problems.push(`${at}: text outside a field`)
    else if (Object.hasOwn(scan.fields, name)) scan.problems.push(`${at}: field ${name} appears twice`)
    else {
        scan.mode = "expect"
        scan.name = name
    }
}

const openValue = (scan: Scan): void => {
    scan.mode = "value"
    scan.lines = []
}

const rejectHeader = (scan: Scan, at: string): void => {
    scan.problems.push(`${at}: field ${scan.name} does not start with the separator line`)
    scan.mode = "outside"
}

const closeValue = (scan: Scan): void => {
    scan.fields[scan.name] = scan.lines.join("\n")
    scan.mode = "outside"
}

/**
 * Reads the field format of the content files: `# name`, the marker line, the value, the marker line. A `# ` line inside a
 * value is part of the value; outside one it names the next field. A duplicate field, text between fields and a field that
 * is not closed are problems, never silently skipped.
 */
export const parseSeparatorFields = (text: string): SeparatorFields => {
    const scan: Scan = { mode: "outside", name: "", lines: [], fields: {}, problems: [] }
    text.split(/\r?\n/u).forEach((line, index) => {
        const isMarker = line.trim() === SEPARATOR_MARKER
        const at = `line ${index + 1}`
        if (scan.mode === "value") {
            if (isMarker) closeValue(scan)
            else scan.lines.push(line)
        } else if (scan.mode === "expect") {
            if (isMarker) openValue(scan)
            else rejectHeader(scan, at)
        } else outside(scan, line, at)
    })
    if (scan.mode !== "outside") scan.problems.push(`field ${scan.name} is not closed by the separator line`)
    return { fields: scan.fields, problems: scan.problems }
}
