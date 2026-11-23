/** A run of markdown, or one fence that names the file it was copied from (` ```ts file=src/products.ts lines=123-131 `). */
export type FencePiece =
    | { readonly kind: "markdown"; readonly source: string }
    | {
          readonly kind: "file"
          readonly language: string | null
          /** The file, with its line range when the fence names one (`src/products.ts:123-131`). */
          readonly path: string
          readonly code: string
      }

/** The opening line of a fence and its info string. */
const OPENING = /^ {0,3}(`{3,}|~{3,})(.*)$/u

/** One `key=value` pair of an info string (the value quoted or bare). */
const PAIR = /([A-Za-z][\w-]*)=(?:"([^"]*)"|(\S+))/gu

/** True for the line that closes a fence opened with `mark`: the same character, at least as many, nothing else. */
const isClosing = (line: string, mark: string): boolean => {
    const trimmed = line.trim()
    return trimmed.length >= mark.length && trimmed === mark.charAt(0).repeat(trimmed.length)
}

/** The pairs of an info string after its language. */
const metaOf = (info: string): Readonly<Record<string, string>> =>
    Object.fromEntries([...info.matchAll(PAIR)].map((m) => [m[1] ?? "", m[2] ?? m[3] ?? ""]))

/**
 * Cuts a markdown source at the fences whose info string names a `file=`: Grammar's `Markdown` reads only a fence's language, so those
 * fences are drawn by the caller with their file and line range in the header. Every other fence stays inside its markdown run.
 */
export const fileFencesOf = (source: string): ReadonlyArray<FencePiece> => {
    const pieces: Array<FencePiece> = []
    const lines = source.split("\n")
    let plain: Array<string> = []
    const flushPlain = () => {
        if (plain.join("\n").trim() !== "") pieces.push({ kind: "markdown", source: plain.join("\n") })
        plain = []
    }
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index] ?? ""
        const opening = OPENING.exec(line)
        if (opening === null) {
            plain.push(line)
            continue
        }
        const mark = opening[1] ?? "```"
        const end = lines.findIndex((each, at) => at > index && isClosing(each, mark))
        const close = end < 0 ? lines.length : end
        const info = (opening[2] ?? "").trim()
        const meta = metaOf(info)
        const file = meta["file"] ?? ""
        if (file === "") {
            plain.push(...lines.slice(index, close + 1))
        } else {
            flushPlain()
            const language = info.split(/\s+/u)[0] ?? ""
            const range = meta["lines"] ?? ""
            pieces.push({
                kind: "file",
                language: language === "" || language.includes("=") ? null : language,
                path: range === "" ? file : `${file}:${range}`,
                code: lines.slice(index + 1, close).join("\n"),
            })
        }
        index = close
    }
    flushPlain()
    return pieces
}
