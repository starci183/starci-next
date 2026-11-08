import type { CoachCriterionGrade, CoachGrade } from "./attempt.contracts"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"

type Json = Record<string, unknown>

const invalid = (cause?: unknown): AttemptError => new AttemptError({ code: AttemptErrorCode.CoachInvalid, cause })

const isJson = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value)

/** The object a model wrote: the whole text, or the part between the first `{` and the last `}` when it wrapped the JSON in a fence or a sentence. */
const objectTextOf = (text: string): string => {
    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    return start === -1 || end < start ? text : text.slice(start, end + 1)
}

const parsed = (text: string): unknown => {
    try {
        return JSON.parse(objectTextOf(text))
    } catch (cause) {
        throw invalid(cause)
    }
}

const gradeOf = (entry: unknown): CoachCriterionGrade => {
    if (!isJson(entry)) throw invalid()
    const { criterionId, level, evidenceQuote } = entry
    if (typeof criterionId !== "string" || typeof level !== "number") throw invalid()
    if (evidenceQuote !== undefined && typeof evidenceQuote !== "string") throw invalid()
    return { criterionId, level, evidenceQuote: evidenceQuote ?? "" }
}

/**
 * Reads the text a model answered into the per-criterion grade: one JSON object holding `criteria`, each entry a criterion id,
 * a level and an evidence quote (absent at level 0). A text that is not that shape is refused as ATTEMPT_COACH_INVALID; the
 * rubric check of the attempt capability then judges the ids, the levels and the quotes, so nothing here is stored.
 */
export const coachGradeOf = (text: string): CoachGrade => {
    const body = parsed(text)
    if (!isJson(body) || !Array.isArray(body.criteria)) throw invalid()
    return { criteria: body.criteria.map((entry) => gradeOf(entry)) }
}
