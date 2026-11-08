/** The line that opens and closes the value of one field in a mount file. */
export const MOUNT_MARKER = "<!-- @starci/seperator -->"

/** One list item of a mount field: a text, or an object of named sub-fields. */
export type MountItem = string | Readonly<Record<string, string>>

/** The value of a mount field: a text, or a list of items. */
export type MountValue = string | ReadonlyArray<MountItem>

/** The fields of a mount file and what was wrong with its layout. */
export interface MountDocument {
    /** The value of each top-level field by name. */
    readonly fields: Readonly<Record<string, MountValue>>
    /** The layout problems, in the order they appear; empty for a well-formed file. */
    readonly problems: ReadonlyArray<string>
}

/** One header read: its depth, its name, and its value when a marker pair followed it. */
interface Header {
    readonly depth: number
    readonly name: string
    value: string | null
}

const HEADER = /^#{1,3} [^\n\r\u2028\u2029]/u

/** The scan state: the header waiting for its value, the value being read, and the problems found. */
interface Scan {
    pending: Header | null
    open: { readonly header: Header; readonly lines: Array<string> } | null
    readonly headers: Array<Header>
    readonly problems: Array<string>
}

const openHeader = (scan: Scan, line: string, at: string): void => {
    if (!HEADER.test(line)) {
        if (line.trim() !== "") scan.problems.push(`${at}: text outside a field`)
        return
    }
    const space = line.indexOf(" ")
    const header: Header = { depth: space, name: line.slice(space + 1).trim(), value: null }
    scan.headers.push(header)
    scan.pending = header
}

const onMarker = (scan: Scan, at: string): void => {
    if (scan.open !== null) {
        scan.open.header.value = scan.open.lines.join("\n")
        scan.open = null
        scan.pending = null
    } else if (scan.pending !== null) scan.open = { header: scan.pending, lines: [] }
    else scan.problems.push(`${at}: separator line outside a field`)
}

const stepOf = (scan: Scan, line: string, index: number): void => {
    const at = `line ${index + 1}`
    if (line.trim() === MOUNT_MARKER) onMarker(scan, at)
    else if (scan.open !== null) scan.open.lines.push(line)
    else openHeader(scan, line, at)
}

/** Builds the fields from the headers in order: a depth 2 item under a depth 1 list, a depth 3 sub-field under an item. */
const fieldsOf = (headers: ReadonlyArray<Header>, problems: Array<string>): Record<string, MountValue> => {
    const fields: Record<string, MountValue> = {}
    let list: Array<MountItem> | null = null
    let object: Record<string, string> | null = null
    headers.forEach((header) => {
        if (header.depth === 1) {
            object = null
            if (header.value === null) {
                list = []
                fields[header.name] = list
            } else {
                list = null
                fields[header.name] = header.value
            }
        } else if (header.depth === 2 && list !== null) {
            if (header.value === null) {
                object = {}
                list.push(object)
            } else {
                object = null
                list.push(header.value)
            }
        } else if (header.depth === 3 && object !== null && header.value !== null) {
            object[header.name] = header.value
        } else problems.push(`field ${header.name} sits outside its list`)
    })
    return fields
}

/**
 * Reads the field format of the mount files: `# name` then the marker line, the value, the marker line; a list field is a
 * `# name` header followed by `## n` items, each a value or an object of `### key` values. A `#` line inside a value is part of the
 * value. A header with no value and no children is an empty list. A field that is not closed, text between fields and a
 * duplicate field are problems, never silently skipped. CRLF and LF are both accepted.
 */
export const parseMount = (text: string): MountDocument => {
    const scan: Scan = { pending: null, open: null, headers: [], problems: [] }
    text.split(/\r?\n/u).forEach((line, index) => stepOf(scan, line, index))
    if (scan.open !== null) scan.problems.push(`field ${scan.open.header.name} is not closed by the separator line`)
    const names = scan.headers.filter((header) => header.depth === 1).map((header) => header.name)
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index)
    duplicates.forEach((name) => scan.problems.push(`field ${name} appears twice`))
    const fields = fieldsOf(scan.headers, scan.problems)
    return { fields, problems: scan.problems }
}
