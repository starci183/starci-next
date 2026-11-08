import type {
    InterviewLocale,
    Localized,
    QuestionGrading,
    QuestionPrompt,
    SessionQuestion,
} from "./interview.contracts"
import type { QuestionPublicRow } from "./persistence/interview.rows"

/** The prompt a question shows when a stored body is missing: nothing, which the callers treat as a data fault. */
const EMPTY_PROMPT: QuestionPrompt = { prompt: "", givenCode: null, diagram: null }

/** The code language a question is asked in when none was chosen: the first body it has. */
export const firstLanguageOf = (bodies: Readonly<Record<string, Localized<QuestionPrompt>>>): string =>
    Object.keys(bodies)[0] ?? "agnostic"

/** The prompt of a question body in one locale; empty when the question has no such body. */
export const promptOf = (
    bodies: Readonly<Record<string, Localized<QuestionPrompt>>>,
    language: string,
    locale: InterviewLocale,
): QuestionPrompt => bodies[language]?.[locale] ?? EMPTY_PROMPT

/** The teacher's ideal answer for a code language and locale; empty when the question has none (a behavioural question). */
export const idealOf = (grading: QuestionGrading, language: string, locale: InterviewLocale): string =>
    grading.ideal[language]?.[locale] ?? ""

/** The text a learner reads next to the prompt: the given code in a fence, then the diagram, or an empty text. */
export const materialOf = (prompt: QuestionPrompt): string =>
    [prompt.givenCode, prompt.diagram].filter((part): part is string => part !== null).join("\n\n")

/** The prompt the interviewer says when it opens the question at a position; empty when the session or the rows do not hold it. */
export const promptAtOf = (
    drawn: ReadonlyArray<SessionQuestion>,
    rows: ReadonlyArray<QuestionPublicRow>,
    position: number,
    locale: InterviewLocale,
): string => {
    const question = drawn.find((entry) => entry.position === position)
    const row = rows.find((entry) => entry.question_id === question?.questionId)
    return question === undefined || row === undefined ? "" : promptOf(row.bodies, question.bodyLanguage, locale).prompt
}
