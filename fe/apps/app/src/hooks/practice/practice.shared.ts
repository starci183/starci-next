import { ApiFailure } from "@/modules/failure"
import { PRACTICE_LANGUAGES, type PracticeLanguageId, type PracticeProblemView } from "@/modules/types"

/** The stable code a door answers when the learner submitted too often. */
const RATE_LIMITED_CODE = "PRACTICE_RATE_LIMITED"

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

/** A technique tag in words: the camelCase id the data carries ("twoPointers") as a sentence-case label ("Two pointers"). */
export const tagLabelOf = (tag: string): string => {
    const words = tag.replace(/([a-z\d])([A-Z])/g, "$1 $2").toLowerCase()
    return `${words.slice(0, 1).toUpperCase()}${words.slice(1)}`
}

/** The starter code of a problem in a language; empty when the data has none. */
export const starterOf = (problem: PracticeProblemView, language: PracticeLanguageId): string =>
    problem.starterCodes.find((each) => each.language === language)?.content ?? ""

/** Why the last run, submission or hint did not go through; `none` when it did. */
export type PracticeIssue = "none" | "rateLimited" | "other"

/** The issue a failed call is shown as; the stable code decides, never the status. */
export const issueOf = (error: unknown): PracticeIssue => (isPracticeRateLimited(error) ? "rateLimited" : "other")
