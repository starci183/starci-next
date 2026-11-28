import { Avatar, Cluster, Code, GlossaryTerm, Quote, Stack, Text } from "@starci/grammar/common"
import type { ReactNode } from "react"

/**
 * The narration of a lesson (lessons.md §9, owner 2026-11-28): Vietnamese sentences with English keywords, written as one line of inline
 * markdown in the lab record. `**order service**` is a service named in full and drawn strong, `` `checkout.ts` `` is a name from the code
 * drawn as code, and a keyword the record's `terms` explains ("timeout", "retry") gets a dotted underline whose note shows on hover, focus
 * or tap (Grammar `GlossaryTerm`): no explanation in the sentence and no list of terms under it. A quote (the interviewer's words, a
 * follow-up question, the model answer) is never narration: it stays plain text, so its keywords are never marked.
 */

/** One keyword of the narration and its one sentence, already in the reader's language. */
export type NarrationTerm = {
    /** The keyword as it stands in a sentence ("timeout", "primary key"). */
    readonly term: string
    /** Its one plain sentence. */
    readonly note: string
}

/** A run of a narration line: code, strong words, quoted words or plain words. */
type Piece = { readonly kind: "code" | "strong" | "quote" | "plain"; readonly text: string }

/** `code` between backticks, then `**strong**` spans; the rest is words. */
const codePiecesOf = (text: string): ReadonlyArray<Piece> =>
    text.split("`").flatMap((part, index): ReadonlyArray<Piece> => {
        if (part === "") return []
        if (index % 2 === 1) return [{ kind: "code", text: part }]
        return part.split(/\*\*([^*]+)\*\*/u).flatMap((words, inner): ReadonlyArray<Piece> => {
            if (words === "") return []
            return inner % 2 === 1 ? [{ kind: "strong", text: words }] : quotePiecesOf(words)
        })
    })

/** Words with a “quoted” span cut out of them: a quote inside a narration line stays plain (no keyword marks). */
const quotePiecesOf = (words: string): ReadonlyArray<Piece> =>
    words.split(/(“[^”]*”)/u).flatMap((part): ReadonlyArray<Piece> => {
        if (part === "") return []
        return [{ kind: part.startsWith("“") ? "quote" : "plain", text: part }]
    })

/** The regular-expression text of a keyword, every special character escaped. */
const escaped = (term: string): string => term.replaceAll(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`)

/** Where a keyword first stands in a run of words, case ignored and as a whole word; undefined when it does not. */
const indexOfTerm = (words: string, term: string): number | undefined => {
    const found = new RegExp(`(?<![\\p{L}\\p{N}])${escaped(term)}(?![\\p{L}\\p{N}])`, "iu").exec(words)
    return found === null ? undefined : found.index
}

/** The words of a line where keywords may be marked: its plain and strong runs, never its code or its quotes. */
const markableWordsOf = (text: string): string =>
    codePiecesOf(text)
        .map((piece) => (piece.kind === "plain" || piece.kind === "strong" ? piece.text : " "))
        .join(" ")

/**
 * Which keywords each line of one section marks: a keyword is marked where it FIRST stands in the section (owner: three dots under the
 * word, once), so the lines are read in order and a keyword already marked above is left plain below. The section is the caller's: one
 * page part (the scene of the interview, one case, the retelling).
 */
export const narrationTermsOf = (
    lines: ReadonlyArray<string>,
    terms: ReadonlyArray<NarrationTerm>,
): ReadonlyArray<ReadonlyArray<NarrationTerm>> => {
    const seen = new Set<string>()
    return lines.map((line) => {
        const words = markableWordsOf(line)
        const used = terms.filter((each) => !seen.has(each.term) && indexOfTerm(words, each.term) !== undefined)
        for (const each of used) seen.add(each.term)
        return used
    })
}

/** The first keyword in a run of words (the longest one when two start at the same place); undefined when none stands in it. */
const firstTermIn = (
    words: string,
    terms: ReadonlyArray<NarrationTerm>,
): { readonly index: number; readonly length: number; readonly term: NarrationTerm } | undefined => {
    let found: { index: number; length: number; term: NarrationTerm } | undefined
    for (const each of terms) {
        const index = indexOfTerm(words, each.term)
        if (index === undefined) continue
        if (found === undefined || index < found.index || (index === found.index && each.term.length > found.length))
            found = { index, length: each.term.length, term: each }
    }
    return found
}

/** A run of words with each keyword still to mark drawn as a `GlossaryTerm` (its dotted underline and note); `pending` loses what it marks. */
const markedWords = (words: string, pending: Set<NarrationTerm>, key: string): ReactNode[] => {
    const hit = firstTermIn(words, [...pending])
    if (hit === undefined) return words === "" ? [] : [words]
    pending.delete(hit.term)
    return [
        words.slice(0, hit.index),
        <GlossaryTerm key={`${key}-${String(hit.index)}`} definition={hit.term.note}>
            {words.slice(hit.index, hit.index + hit.length)}
        </GlossaryTerm>,
        ...markedWords(words.slice(hit.index + hit.length), pending, `${key}-${String(hit.index)}`),
    ]
}

/** What one narration line needs: its markdown and the keywords it marks (from {@link narrationTermsOf}). */
type NarrationTextProps = {
    readonly text: string
    readonly terms?: ReadonlyArray<NarrationTerm>
}

/**
 * One line of narration drawn inline: strong service names, code names as Grammar `Code`, each keyword it is given marked once where it
 * first stands, quotes inside it left plain; no asterisk or backtick ever reaches the reader. It draws inline content only, so the caller
 * places it in its own `Text` (a paragraph, a list row's `titleContent`).
 */
export const NarrationText = (props: NarrationTextProps) => {
    const pending = new Set(props.terms ?? [])
    return codePiecesOf(props.text).map((piece, index) => {
        const key = `${String(index)}-${piece.kind}`
        if (piece.kind === "code") return <Code key={key}>{piece.text}</Code>
        if (piece.kind === "quote") return <span key={key}>{piece.text}</span>
        if (piece.kind === "strong")
            return (
                <Text key={key} as="span" isStrong>
                    {markedWords(piece.text, pending, key)}
                </Text>
            )
        return <span key={key}>{markedWords(piece.text, pending, key)}</span>
    })
}

/** The words of a narration line as plain text (an accessible name, a list row's `title`): no backticks, no `**` marks. */
export const narrationPlainOf = (text: string): string => text.replaceAll("`", "").replaceAll("**", "")

/** Who narrates: the mentor's photo, his name for assistive technology and the label shown beside it ("Thầy StarCi"). */
export type NarratorView = {
    /** The photo's URL (a repo static), or undefined to draw the initials. */
    readonly avatar: string | undefined
    /** The narrator label beside the photo. */
    readonly label: string
    /** Who he is, muted and small under the label ("CTO nivo.vn"); empty draws nothing. */
    readonly title: string
}

/** What a narrated block needs: who narrates and the paragraphs he says. */
type NarratorProps = {
    readonly narrator: NarratorView
    readonly children: ReactNode
}

/**
 * The narration with its narrator (owner: "để cái mặt thầy"): the mentor's photo beside his name with who he is under it, the paragraphs under
 * it. The interviewer's question never stands inside it: it is an {@link InterviewerQuote} of its own.
 */
export const Narrator = (props: NarratorProps) => (
    <Stack gap="row">
        <Cluster gap="inline" align="center">
            <Avatar name={props.narrator.label} {...(props.narrator.avatar === undefined ? {} : { src: props.narrator.avatar })} />
            {/* The name, then who he is under it, small and muted (owner 2026-11-28: "dòng cto nivo ở dưới text-xs muted"). */}
            <Stack gap="identity">
                <Text as="p" role="label.item">
                    {props.narrator.label}
                </Text>
                {props.narrator.title === "" ? null : (
                    <Text as="p" role="caption" tone="muted">
                        {props.narrator.title}
                    </Text>
                )}
            </Stack>
        </Cluster>
        <Stack gap="section">{props.children}</Stack>
    </Stack>
)

/** What a quoted question needs: the words, plain, without quote marks of their own. */
type InterviewerQuoteProps = {
    readonly quote: string
}

/**
 * The interviewer's words, standing apart from the narration: Grammar's own `Quote` block (owner 2026-11-28) with the words as plain
 * text, no markdown, no keyword marks (owner: "quote thì plain text") and no quote marks added by the app: the block is the quote. No
 * source and no byline: the asker is the narrator whose header (photo and "Thầy StarCi · CTO nivo.vn") already stands above it (owner:
 * "trên có mặt rồi cần thầy starci cto hỏi chi nữa?"), and the page names no moment of the interview.
 */
export const InterviewerQuote = (props: InterviewerQuoteProps) => <Quote variant="block" text={props.quote} />
