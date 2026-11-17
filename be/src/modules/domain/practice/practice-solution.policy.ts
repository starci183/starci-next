import {
    PRACTICE_LANGUAGES,
    PRACTICE_LANGUAGE_NAMES,
    type PracticeLocale,
    type PracticeSolutions,
} from "./practice.contracts"

/** The name a stored language id is shown with; an id the judge does not know is shown as it is. */
export const languageNameOf = (language: string): string => {
    const names: Readonly<Record<string, string>> = PRACTICE_LANGUAGE_NAMES
    return Object.hasOwn(names, language) ? (names[language] ?? language) : language
}

/** The fence that wraps a piece of code: backticks, always one more than the longest run inside, at least three. */
const fenceOf = (code: string): string => {
    const longest = Math.max(0, ...(code.match(/`+/gu) ?? []).map((run) => run.length))
    return "`".repeat(Math.max(3, longest + 1))
}

/**
 * The solution of a problem as markdown: the explanation the author wrote in the locale (when there is one), then the reference
 * code of every language in a fenced block named by its language.
 */
export const solutionMarkdownOf = (
    explanations: Readonly<Record<PracticeLocale, string>>,
    solutions: PracticeSolutions,
    locale: PracticeLocale,
): string => {
    const blocks = PRACTICE_LANGUAGES.filter((language) => solutions[language] !== "").map((language) => {
        const code = solutions[language].trimEnd()
        const fence = fenceOf(code)
        return `${fence}${language}\n${code}\n${fence}`
    })
    const explanation = explanations[locale]?.trim() ?? ""
    return [...(explanation === "" ? [] : [explanation]), ...blocks].join("\n\n")
}
