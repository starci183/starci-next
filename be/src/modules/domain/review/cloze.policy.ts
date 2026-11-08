import { createHash } from "node:crypto"
import type { ReviewCloze } from "./review.contracts"

const CLOZE = /\{\{c(\d+)::((?:(?!::|\}\}).)*)(?:::((?:(?!\}\}).)*))?\}\}/gu

/** Reads the cloze terms `{{cN::term::distractor1,distractor2}}` of an answer in order of appearance. */
export const parseClozes = (answer: string): ReadonlyArray<ReviewCloze> => {
    const found: Array<ReviewCloze> = []
    answer.replaceAll(CLOZE, (_all, n: string, term: string, list: string | undefined) => {
        found.push({
            n: Number(n),
            term: term.trim(),
            distractors: (list ?? "")
                .split(",")
                .map((distractor) => distractor.trim())
                .filter((distractor) => distractor !== ""),
        })
        return ""
    })
    return found
}

/** Names what is wrong with the cloze terms of one card locale; empty when they are all usable. */
export const clozeProblems = (clozes: ReadonlyArray<ReviewCloze>): ReadonlyArray<string> =>
    clozes.flatMap((cloze) => {
        const problems: Array<string> = []
        if (cloze.term === "") problems.push(`cloze c${cloze.n} has an empty term`)
        if (cloze.distractors.length === 0) problems.push(`cloze c${cloze.n} has no distractor`)
        if (cloze.distractors.some((distractor) => distractor.toLowerCase() === cloze.term.toLowerCase()))
            problems.push(`cloze c${cloze.n} has a distractor equal to its term`)
        return problems
    })

/** Shows the answer with each cloze term in bold and its distractors dropped. */
export const revealAnswer = (answer: string): string =>
    answer.replaceAll(CLOZE, (_all, _n: string, term: string) => `**${term.trim()}**`)

/**
 * The choices of a cloze check: the term and its distractors in an order fixed by a hash of the seed, so a reload shows the
 * same order and the position of the term says nothing.
 */
export const clozeChoices = (cloze: ReviewCloze, seed: string): ReadonlyArray<string> =>
    [cloze.term, ...cloze.distractors]
        .map((choice) => ({ choice, key: createHash("sha256").update(`${seed}\u0000${choice}`).digest("hex") }))
        .sort((a, b) => a.key.localeCompare(b.key))
        .map((entry) => entry.choice)
