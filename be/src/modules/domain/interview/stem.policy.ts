/** The shortest run of shared words that counts as the prompt giving the answer away. */
export const GIVEAWAY_RUN = 18

/** The share of a clause's words found in the grading text above which the clause is the answer, not the question. */
const LEAK_SHARE = 0.5

/** A clause shorter than this many words is never taken for an answer. */
const LEAK_MIN_WORDS = 4

const wordsOf = (text: string): ReadonlyArray<string> =>
    text
        .toLowerCase()
        .normalize("NFC")
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word !== "")

/** The words longer than two letters of the texts used for grading: the vocabulary of the answer. */
export const groundOf = (texts: ReadonlyArray<string>): ReadonlySet<string> =>
    new Set(texts.flatMap((text) => wordsOf(text)).filter((word) => word.length > 2))

/** Whether a clause is made of the answer's own words: long enough, and mostly found in the grading text. */
const isAnswer = (clause: string, ground: ReadonlySet<string>): boolean => {
    const words = wordsOf(clause).filter((word) => word.length > 2)
    return (
        words.length >= LEAK_MIN_WORDS && words.filter((word) => ground.has(word)).length / words.length >= LEAK_SHARE
    )
}

/** Drops the parenthetical hints that spell out the expected points: `(MISS - the system does the real work ...)`. */
const withoutHints = (prompt: string, ground: ReadonlySet<string>): string =>
    prompt.replaceAll(/\(([^()]{20,})\)/gu, (whole, inner: string) => (isAnswer(inner, ground) ? "" : whole))

/** Drops the dash tail of a sentence that spells out what the answer must say: `... the fast copy - it can go stale ...`. */
const withoutTails = (prompt: string, ground: ReadonlySet<string>): string =>
    prompt
        .split(/(?<=[.?!])\s+/u)
        .map((sentence) => {
            const dash = sentence.indexOf(" — ")
            if (dash === -1) return sentence
            const stop = /[.?!]$/u.test(sentence) ? sentence.slice(-1) : ""
            const tail = sentence.slice(dash + 3).replace(/[.?!]$/u, "")
            return isAnswer(tail, ground) ? `${sentence.slice(0, dash)}${stop}` : sentence
        })
        .join(" ")

const tidied = (prompt: string): string =>
    prompt
        .replaceAll(/[ \t]{2,}/gu, " ")
        .replaceAll(/[ \t]([,.?!;:])/gu, "$1")
        .replaceAll(/,\s*([.?!])/gu, "$1")
        .trim()

/**
 * The question stem: the teacher's prompt without the parenthetical hints and the dash tails that already say what a strong
 * answer says. What the learner and the interviewer read is the stem; the expected points stay in the rubric, the checklist and the
 * ideal answer, which are released only with the scorecard.
 */
export const stemOf = (prompt: string, ground: ReadonlySet<string>): string =>
    tidied(withoutTails(withoutHints(prompt, ground), ground))

/** Whether a prompt still shares a run of `GIVEAWAY_RUN` words with a text used for grading: the answer is in the question. */
export const givesAwayAnswer = (prompt: string, graded: ReadonlyArray<string>): boolean => {
    const asked = wordsOf(prompt)
    const runs = new Set(
        asked.flatMap((_word, at) =>
            at + GIVEAWAY_RUN <= asked.length ? [asked.slice(at, at + GIVEAWAY_RUN).join(" ")] : [],
        ),
    )
    return graded.some((text) => {
        const words = wordsOf(text)
        return words.some(
            (_word, at) => at + GIVEAWAY_RUN <= words.length && runs.has(words.slice(at, at + GIVEAWAY_RUN).join(" ")),
        )
    })
}
