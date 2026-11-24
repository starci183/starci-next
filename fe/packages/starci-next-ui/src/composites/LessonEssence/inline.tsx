import { Code, SidenoteTerm, Text } from "@starci/grammar/common"
import type { ReactNode } from "react"

/**
 * One term of the lesson's glossary: the words as they stand in a sentence, their one-line definition and, when the term ships one,
 * Học thêm (`more`: a few sentences and one fenced demo code block).
 */
export type GlossaryEntry = { readonly term: string; readonly definition: string; readonly more?: string }

/** A `**strong**` span of authored prose. */
const STRONG = /\*\*([^*]+)\*\*/u

/**
 * A run of words outside code with its `**strong**` spans drawn as strong Grammar `Text`, so an asterisk never reaches the reader;
 * `plain` draws the words between (and inside) them.
 */
const withStrong = (text: string, key: string, plain: (words: string, key: string) => ReactNode[]): ReactNode[] =>
    text.split(new RegExp(STRONG.source, "gu")).flatMap((part, index): ReactNode[] =>
        index % 2 === 1
            ? [
                  <Text key={`${key}-strong-${index}`} as="span" isStrong>
                      {plain(part, `${key}-strong-${index}`)}
                  </Text>,
              ]
            : plain(part, `${key}-${index}`),
    )

/**
 * The words of a sentence with its `inline code` spans drawn as Grammar `Code` and its `**strong**` spans as strong `Text`, so neither
 * a backtick nor an asterisk reaches the reader.
 */
export const withInlineCode = (text: string): ReactNode =>
    text
        .split(/`([^`]+)`/)
        .flatMap((part, index): ReactNode[] =>
            index % 2 === 1
                ? [<Code key={`${index}-${part}`}>{part}</Code>]
                : withStrong(part, `${index}`, (words) => (words === "" ? [] : [words])),
        )

/** A fenced code block of authored prose: three backticks and the language on one line, the lines, three backticks on their own line. */
const FENCE = /^```[^\n]*\n[\s\S]*?\n```[ \t]*$/gmu

/**
 * The paragraphs of an authored text: split on a blank line, each trimmed, empty ones dropped. A fenced code block stays one paragraph
 * whole, blank lines inside it included, so the prose draws it as code ({@link fenceOf}).
 */
export const paragraphsOf = (text: string): ReadonlyArray<string> => {
    const paragraphs: string[] = []
    const prose = (words: string): void => {
        for (const paragraph of words.split(/\n\s*\n/u)) if (paragraph.trim() !== "") paragraphs.push(paragraph.trim())
    }
    let at = 0
    for (const match of text.matchAll(FENCE)) {
        prose(text.slice(at, match.index))
        paragraphs.push(match[0].trim())
        at = match.index + match[0].length
    }
    prose(text.slice(at))
    return paragraphs
}

/** A paragraph that is a fenced code block, as its language and its lines; undefined for a paragraph of words. */
export const fenceOf = (paragraph: string): { readonly lang: string; readonly code: string } | undefined => {
    const match = /^```([^\n]*)\n([\s\S]*?)\n```$/u.exec(paragraph)
    if (match === null) return undefined
    return { lang: (match[1] ?? "").trim().split(/\s/u)[0] ?? "", code: match[2] ?? "" }
}

/** The words of an authored text without its fenced code blocks, for finding the glossary terms the prose uses. */
export const wordsOutsideCode = (text: string): string => text.replaceAll(FENCE, " ")

/** The words of a sentence as plain text, for an accessible name: no backticks, no `**` marks. */
export const plainWordsOf = (text: string): string => text.replaceAll("`", "").replaceAll("**", "")

/** The id a term's margin note goes by. */
export const termIdOf = (entry: GlossaryEntry): string => `term-${entry.term.toLowerCase().replaceAll(/s+/gu, "-")}`

/** The regular-expression text of a term, every special character escaped. */
const escaped = (term: string): string => term.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`)

/** The first place one of the terms stands in a run of plain words, case ignored; undefined when none does. */
const firstTermIn = (
    text: string,
    terms: ReadonlyArray<GlossaryEntry>,
): { readonly index: number; readonly length: number; readonly entry: GlossaryEntry } | undefined => {
    let found: { index: number; length: number; entry: GlossaryEntry } | undefined
    for (const entry of terms) {
        const match = new RegExp(`(?<![\\p{L}\\p{N}])${escaped(entry.term)}(?![\\p{L}\\p{N}])`, "iu").exec(text)
        if (match !== null && (found === undefined || match.index < found.index))
            found = { index: match.index, length: match[0].length, entry }
    }
    return found
}

/** A run of plain words with each glossary term it holds drawn as a Grammar `SidenoteTerm` (its note in the margin of `Sidenotes`). */
const withTermsPlain = (text: string, terms: ReadonlyArray<GlossaryEntry>, key: string): ReactNode[] => {
    const hit = firstTermIn(text, terms)
    if (hit === undefined) return text === "" ? [] : [text]
    const rest = terms.filter((entry) => entry !== hit.entry)
    return [
        text.slice(0, hit.index),
        <SidenoteTerm key={`${key}-${hit.index}`} id={termIdOf(hit.entry)}>
            {text.slice(hit.index, hit.index + hit.length)}
        </SidenoteTerm>,
        ...withTermsPlain(text.slice(hit.index + hit.length), rest, `${key}-${hit.index}`),
    ]
}

/**
 * The words of a sentence with its `inline code` as `Code`, its `**strong**` spans as strong `Text` and the first use of each glossary
 * term as a `SidenoteTerm`.
 */
export const withTerms = (text: string, terms: ReadonlyArray<GlossaryEntry>): ReactNode =>
    text
        .split(/`([^`]+)`/)
        .flatMap((part, index): ReactNode[] =>
            index % 2 === 1
                ? [<Code key={`${index}-${part}`}>{part}</Code>]
                : withStrong(part, `${index}`, (words, key) => withTermsPlain(words, terms, key)),
        )

/** The glossary entries a question's own words use, in the glossary's order. */
export const termsUsedIn = (
    texts: ReadonlyArray<string>,
    glossary: ReadonlyArray<GlossaryEntry>,
): ReadonlyArray<GlossaryEntry> => {
    const words = wordsOutsideCode(texts.join("\n"))
    return glossary.filter((entry) => firstTermIn(words, [entry]) !== undefined)
}
