import type { PracticeRow } from "@starci-next/ui"
import { ApiFailure } from "@/modules/failure"
import { practicePatternPath, practiceProblemPath } from "@/modules/routes"
import {
    PRACTICE_LANGUAGES,
    type PracticeLanguageId,
    type PracticePatternRow,
    type PracticeProblemItemView,
    type PracticeProblemView,
    type PracticeProgress,
} from "@/modules/types"

/** The stable code a door answers when the problem is outside the reader's plan. */
const LOCKED_CODE = "PRACTICE_PROBLEM_LOCKED"

/** The stable code a door answers when the learner submitted too often. */
const RATE_LIMITED_CODE = "PRACTICE_RATE_LIMITED"

/** True when the refusal says the problem is outside the plan. It branches on the stable code, never on the status. */
export const isPracticeLocked = (error: unknown): boolean => error instanceof ApiFailure && error.code === LOCKED_CODE

/** True when the refusal says the learner has to wait before the next run or submission. */
export const isPracticeRateLimited = (error: unknown): boolean =>
    error instanceof ApiFailure && error.code === RATE_LIMITED_CODE

/** The name of a language in the editor's select. */
const languageNameOf = (language: PracticeLanguageId): string => {
    switch (language) {
        case "CPP":
            return "C++"
        case "JAVA":
            return "Java"
        case "JAVASCRIPT":
            return "JavaScript"
        case "PYTHON":
            return "Python"
        case "TYPESCRIPT":
            return "TypeScript"
    }
}

/** The language options of the editor select. */
export const languageOptions = (): ReadonlyArray<{ readonly id: string; readonly label: string }> =>
    PRACTICE_LANGUAGES.map((id) => ({ id, label: languageNameOf(id) }))

/** The language an id names, or undefined for anything else. */
export const languageOf = (id: string | null | undefined): PracticeLanguageId | undefined =>
    PRACTICE_LANGUAGES.find((each) => each === id)

/** The tone of a difficulty badge; the contract names it EASY, MEDIUM or HARD. */
export const difficultyToneOf = (difficulty: string): "success" | "warning" | "danger" | "neutral" => {
    switch (difficulty.toLowerCase()) {
        case "easy":
            return "success"
        case "medium":
            return "warning"
        case "hard":
            return "danger"
        default:
            return "neutral"
    }
}

/** The words the lists and the solve screen are built with, resolved by the block. */
export type PracticeWords = {
    readonly open: string
    readonly solve: string
    readonly premium: string
    readonly statuses: Readonly<Record<PracticeProgress, string>>
    readonly progress: (accepted: number, total: number) => string
    readonly difficulty: (difficulty: string) => string
}

/** The badge of a pattern: Premium when the plan opens none of it, Accepted once the learner solved one, else none. */
const patternBadgeOf = (pattern: PracticePatternRow, words: PracticeWords): string => {
    if (pattern.locked) return words.premium
    return pattern.acceptedCount > 0 ? words.statuses.ACCEPTED : ""
}

/** The rows of the pattern list. */
export const patternRowsOf = (
    patterns: ReadonlyArray<PracticePatternRow>,
    words: PracticeWords,
): ReadonlyArray<PracticeRow> =>
    patterns.map((pattern) => ({
        id: pattern.patternId,
        title: pattern.title,
        description: words.progress(pattern.acceptedCount, pattern.problemCount),
        badge: patternBadgeOf(pattern, words),
        badgeTone: pattern.locked ? "muted" : "success",
        href: practicePatternPath(pattern.patternId),
        cta: words.open,
        isCurrent: false,
    }))

/** The tone of a problem's status badge. */
const statusToneOf = (status: PracticeProgress, locked: boolean): PracticeRow["badgeTone"] => {
    if (locked) return "muted"
    switch (status) {
        case "ACCEPTED":
            return "success"
        case "ATTEMPTED":
            return "warning"
        case "UNSOLVED":
            return "neutral"
    }
}

/** The rows of a pattern's problems; `currentSlug` marks the one being solved. */
export const problemRowsOf = (
    problems: ReadonlyArray<PracticeProblemItemView>,
    words: PracticeWords,
    currentSlug: string | undefined,
): ReadonlyArray<PracticeRow> =>
    problems.map((problem) => ({
        id: problem.slug,
        title: problem.title,
        description: [words.difficulty(problem.difficulty), ...problem.tags].join(" · "),
        badge: problem.locked ? words.premium : words.statuses[problem.status],
        badgeTone: statusToneOf(problem.status, problem.locked),
        href: practiceProblemPath(problem.slug),
        cta: words.solve,
        isCurrent: problem.slug === currentSlug,
    }))

/** The starter code of a problem in a language; empty when the data has none. */
export const starterOf = (problem: PracticeProblemView, language: PracticeLanguageId): string =>
    problem.starterCodes.find((each) => each.language === language)?.content ?? ""

/** Why the last run, submission or hint did not go through; `none` when it did. */
export type PracticeIssue = "none" | "locked" | "rateLimited" | "other"

/** The issue a failed call is shown as; the stable code decides, never the status. */
export const issueOf = (error: unknown): PracticeIssue => {
    if (isPracticeLocked(error)) return "locked"
    return isPracticeRateLimited(error) ? "rateLimited" : "other"
}
