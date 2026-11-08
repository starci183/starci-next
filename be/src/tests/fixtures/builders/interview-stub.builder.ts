import type { MockEntityManager } from "@starci/jest-preset"
import type { SessionRow } from "@modules/domain/interview"
import { isRecord } from "@modules/platform/primitives"

/** The scorecard a graded session row holds. */
type StoredScorecard = NonNullable<SessionRow["scorecard"]>

/** The parameter list of the first call that ran `statement`, or none when the statement never ran. */
export const firstParamsOf = (em: MockEntityManager, statement: string): ReadonlyArray<unknown> => {
    const call = em.query.mock.calls.find((entry) => entry[0] === statement)
    const params: unknown = call?.[1]
    return Array.isArray(params) ? params : []
}

/** The value a JSON text stored as a query parameter holds; a text that is not JSON gives its failure instead of throwing. */
export const storedJsonOf = (params: ReadonlyArray<unknown>, index: number): unknown => {
    const text = params[index]
    if (typeof text !== "string") return null
    try {
        return JSON.parse(text)
    } catch (cause) {
        return { unreadable: String(cause) }
    }
}

/** What a spec reads of one question of a stored scorecard. */
export interface StoredQuestionScore {
    /** The position. */
    readonly position: number
    /** Whether the learner skipped it. */
    readonly skipped: boolean
    /** Its score. */
    readonly score: number
    /** The hints used. */
    readonly hintsUsed: number
    /** The points the hints took off. */
    readonly hintPenalty: number
}

/** What a spec reads of a stored scorecard. */
export interface StoredCard {
    /** The overall score. */
    readonly overallScore: number
    /** The verdict. */
    readonly verdict: string
    /** The questions scored. */
    readonly questions: ReadonlyArray<StoredQuestionScore>
}

const numberOf = (value: unknown): number => (typeof value === "number" ? value : Number.NaN)

const questionScoreOf = (value: unknown): StoredQuestionScore => {
    const entry = isRecord(value) ? value : {}
    return {
        position: numberOf(entry["position"]),
        skipped: entry["skipped"] === true,
        score: numberOf(entry["score"]),
        hintsUsed: numberOf(entry["hintsUsed"]),
        hintPenalty: numberOf(entry["hintPenalty"]),
    }
}

/** The stored scorecard of a query parameter, reduced to what the specs read; a value that is not a scorecard reads as empty. */
export const storedCardOf = (params: ReadonlyArray<unknown>, index: number): StoredCard => {
    const value = storedJsonOf(params, index)
    const card = isRecord(value) ? value : {}
    const questions: unknown = card["questions"]
    return {
        overallScore: numberOf(card["overallScore"]),
        verdict: typeof card["verdict"] === "string" ? card["verdict"] : "",
        questions: Array.isArray(questions) ? questions.map((entry) => questionScoreOf(entry)) : [],
    }
}

/** A scorecard that passed with the given overall score and nothing else. */
export const scorecardOf = (overallScore: number): StoredScorecard => ({
    overallScore,
    verdict: "pass",
    technicalScore: overallScore,
    technicalVerdict: "pass",
    behavioralScore: null,
    behavioralVerdict: null,
    attributes: [],
    questions: [],
    strengths: [],
    gaps: [],
})
