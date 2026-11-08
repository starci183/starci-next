import { isRecord } from "@modules/platform/primitives"
import { MAX_QUOTE } from "./grader-prompt.policy"
import { parsedJsonOf } from "./interviewer-reply.policy"
import {
    STAR_KEYS,
    type ChecklistHit,
    type DimensionLevel,
    type GradedQuestion,
    type GradingQuestion,
} from "./interview.contracts"

/** The most characters of a note the grader may write. */
const MAX_NOTE = 600

const LEVEL_MAX = 4

/** What reading a grader reply gave: the readings, or the reason the reply is refused. */
export type GraderReading =
    | { readonly kind: "read"; readonly questions: ReadonlyArray<GradedQuestion> }
    | { readonly kind: "refused"; readonly reason: string; readonly cause?: unknown }

/** One part of a reply read, or the reason it is refused. */
type Step<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly reason: string }

const stepped = <T>(value: T): Step<T> => ({ ok: true, value })

const rejected = (reason: string): Step<never> => ({ ok: false, reason })

/** Where a model joins two pieces of one answer in a single quote: three dots or the ellipsis sign, each piece still a real part of the answer. */
const ELLIPSIS = /\.{3}|\u2026/u

const normalized = (text: string): string => text.toLowerCase().replaceAll(/\s+/gu, " ").trim()

/** Whether the quote is a real, bounded piece of what the candidate wrote in this question. */
const quotedFrom = (quote: unknown, question: GradingQuestion): quote is string => {
    if (typeof quote !== "string") return false
    const said = normalized(
        question.transcript
            .filter((turn) => turn.role === "candidate")
            .map((turn) => turn.content)
            .join("\n"),
    )
    const pieces = normalized(quote)
        .split(ELLIPSIS)
        .map((piece) => piece.trim())
        .filter((piece) => piece !== "")
    return pieces.length > 0 && quote.length <= MAX_QUOTE && pieces.every((piece) => said.includes(piece))
}

const refused = (reason: string, cause?: unknown): GraderReading =>
    cause === undefined ? { kind: "refused", reason } : { kind: "refused", reason, cause }

const hitsOf = (entry: Record<string, unknown>, question: GradingQuestion): Step<ReadonlyArray<ChecklistHit>> => {
    const list: unknown = entry["checklist"]
    const expected = question.material.checklist.length
    if (!Array.isArray(list) || list.length !== expected)
        return rejected(`question ${question.position} must list all ${expected} checklist items`)
    const hits: Array<ChecklistHit> = []
    for (const [index, raw] of list.entries()) {
        if (!isRecord(raw) || raw["item"] !== index || typeof raw["hit"] !== "boolean") {
            return rejected(
                `question ${question.position} checklist entry ${index} must be {"item":${index},"hit":true|false,"evidenceQuote":""}`,
            )
        }
        const quote: unknown = raw["evidenceQuote"]
        if (raw["hit"] && !quotedFrom(quote, question)) {
            return rejected(
                `question ${question.position} checklist item ${index} needs a word-for-word quote of the candidate (at most ${MAX_QUOTE} characters)`,
            )
        }
        hits.push({ item: index, hit: raw["hit"], evidenceQuote: raw["hit"] ? String(quote) : "" })
    }
    return stepped(hits)
}

const levelsOf = (entry: Record<string, unknown>, question: GradingQuestion): Step<ReadonlyArray<DimensionLevel>> => {
    const list: unknown = entry["dimensions"]
    if (!Array.isArray(list) || list.length !== STAR_KEYS.length)
        return rejected(`question ${question.position} must grade the six STAR dimensions`)
    const levels: Array<DimensionLevel> = []
    for (const [index, key] of STAR_KEYS.entries()) {
        const raw: unknown = list[index]
        const level: unknown = isRecord(raw) ? raw["level"] : undefined
        if (
            !isRecord(raw) ||
            raw["key"] !== key ||
            typeof level !== "number" ||
            !Number.isInteger(level) ||
            level < 0 ||
            level > LEVEL_MAX
        ) {
            return rejected(
                `question ${question.position} dimension ${index} must be {"key":"${key}","level":0..${LEVEL_MAX},"evidenceQuote":""}`,
            )
        }
        const quote: unknown = raw["evidenceQuote"]
        if (level > 0 && !quotedFrom(quote, question)) {
            return rejected(
                `question ${question.position} dimension ${key} needs a word-for-word quote of the candidate`,
            )
        }
        levels.push({ key, level, evidenceQuote: level > 0 ? String(quote) : "" })
    }
    return stepped(levels)
}

const questionOf = (raw: unknown, question: GradingQuestion): Step<GradedQuestion> => {
    if (!isRecord(raw) || raw["position"] !== question.position)
        return rejected(`the entry for position ${question.position} is missing or out of order`)
    const technical = question.family === "technical"
    const checklist = technical ? hitsOf(raw, question) : stepped<ReadonlyArray<ChecklistHit>>([])
    const dimensions = technical ? stepped<ReadonlyArray<DimensionLevel>>([]) : levelsOf(raw, question)
    if (!checklist.ok) return checklist
    if (!dimensions.ok) return dimensions
    const note: unknown = raw["note"]
    return stepped({
        position: question.position,
        checklist: checklist.value,
        dimensions: dimensions.value,
        ownershipWeak: raw["ownershipWeak"] === true,
        note: typeof note === "string" ? note.trim().slice(0, MAX_NOTE) : "",
    })
}

/**
 * Reads the text a model answered into one reading per graded question. The reply is refused, with a reason fit to send back to the
 * model, when an entry is missing or out of order, a checklist index or STAR dimension is missing, a level is out of range, or an
 * evidence quote is not a real piece of what the candidate wrote. Nothing here computes a score.
 */
export const graderReadingOf = (text: string, questions: ReadonlyArray<GradingQuestion>): GraderReading => {
    let body: unknown
    try {
        body = parsedJsonOf(text)
    } catch (cause) {
        return refused("the reply is not one JSON object", cause)
    }
    const list: unknown = isRecord(body) ? body["questions"] : undefined
    if (!Array.isArray(list) || list.length !== questions.length)
        return refused(`the reply must hold ${questions.length} question entries`)
    const read: Array<GradedQuestion> = []
    for (const [index, question] of questions.entries()) {
        const entry = questionOf(list[index], question)
        if (!entry.ok) return refused(entry.reason)
        read.push(entry.value)
    }
    return { kind: "read", questions: read }
}
