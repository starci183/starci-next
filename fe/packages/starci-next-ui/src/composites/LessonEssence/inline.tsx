import { Code, GlossaryTerm } from "@starci/grammar/common"
import type { ReactNode } from "react"

/** One term of the lesson's glossary: the words as they stand in a sentence and their one-line definition. */
export type GlossaryEntry = { readonly term: string; readonly definition: string }

/** The words of a question with its `inline code` spans drawn as Grammar `Code`, so a backtick never reaches the reader. */
export const withInlineCode = (text: string): ReactNode =>
    text
        .split(/`([^`]+)`/)
        .map((part, index) => (index % 2 === 1 ? <Code key={`${index}-${part}`}>{part}</Code> : part))

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

/** A run of plain words with each glossary term it holds drawn as a Grammar `GlossaryTerm` (the definition on hover, focus or tap). */
const withTermsPlain = (text: string, terms: ReadonlyArray<GlossaryEntry>, key: string): ReactNode[] => {
    const hit = firstTermIn(text, terms)
    if (hit === undefined) return text === "" ? [] : [text]
    const rest = terms.filter((entry) => entry !== hit.entry)
    return [
        text.slice(0, hit.index),
        <GlossaryTerm key={`${key}-${hit.index}`} definition={hit.entry.definition}>
            {text.slice(hit.index, hit.index + hit.length)}
        </GlossaryTerm>,
        ...withTermsPlain(text.slice(hit.index + hit.length), rest, `${key}-${hit.index}`),
    ]
}

/** The words of a sentence with its `inline code` as `Code` and the first use of each glossary term as a `GlossaryTerm`. */
export const withTerms = (text: string, terms: ReadonlyArray<GlossaryEntry>): ReactNode =>
    text
        .split(/`([^`]+)`/)
        .flatMap((part, index): ReactNode[] =>
            index % 2 === 1 ? [<Code key={`${index}-${part}`}>{part}</Code>] : withTermsPlain(part, terms, `${index}`),
        )

/** The glossary entries a question's own words use, in the glossary's order. */
export const termsUsedIn = (
    texts: ReadonlyArray<string>,
    glossary: ReadonlyArray<GlossaryEntry>,
): ReadonlyArray<GlossaryEntry> => {
    const words = texts.join("\n")
    return glossary.filter((entry) => firstTermIn(words, [entry]) !== undefined)
}
