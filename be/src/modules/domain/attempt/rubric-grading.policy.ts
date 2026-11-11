import type { LessonActivity } from "@modules/domain/lesson"
import type {
    AttemptAnswer,
    AttemptResult,
    CoachCriterion,
    CoachCriterionGrade,
    CoachGrade,
    CriterionResult,
    StoredAttemptResult,
} from "./attempt.contracts"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"

/** The highest level a criterion reaches; levels are whole numbers from 0 to this. */
export const CRITERION_LEVEL_MAX = 2

/** The longest evidence quote a grade may carry. */
const QUOTE_MAX = 600

/** The longest "missing" line a result keeps; a longer one is cut at a word. */
export const MISSING_MAX = 200

const invalid = (): AttemptError => new AttemptError({ code: AttemptErrorCode.CoachInvalid })

const squashed = (value: string): string => value.toLowerCase().replaceAll(/\s+/gu, " ").trim()

/** The rubric of an activity as the coach reads it, with the evidence that only the grader may see. */
export const coachRubricOf = (activity: LessonActivity): ReadonlyArray<CoachCriterion> =>
    (activity.rubric ?? []).map((criterion) => ({
        id: criterion.id,
        criterion: criterion.criterion,
        expectedEvidence: criterion.expectedEvidence,
        misconception: criterion.misconception,
        maxScore: criterion.maxScore,
    }))

const quoteOf = (grade: CoachCriterionGrade, source: string): string => {
    const quote = grade.evidenceQuote.trim()
    if (quote.length > QUOTE_MAX) throw invalid()
    if (grade.level > 0 && (quote === "" || !source.includes(squashed(quote)))) throw invalid()
    return quote
}

const squashedLine = (value: string): string => value.replaceAll(/\s+/gu, " ").trim()

/**
 * The one-line note on what a criterion still lacks: nothing at the full level; otherwise the line the coach gave, and when it
 * gave none, the expected evidence the rubric states, in the locale the lesson is written in.
 */
export const missingOf = (level: number, coachLine: string, expectedEvidence: string): string => {
    if (level >= CRITERION_LEVEL_MAX) return ""
    const line = squashedLine(coachLine) === "" ? squashedLine(expectedEvidence) : squashedLine(coachLine)
    if (line.length <= MISSING_MAX) return line
    const cut = line.slice(0, MISSING_MAX - 1)
    return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1)).trimEnd()}…`
}

const criterionResultOf = (
    criterion: CoachCriterion,
    grade: CoachCriterionGrade | undefined,
    source: string,
): CriterionResult => {
    if (grade === undefined || !Number.isInteger(grade.level) || grade.level < 0 || grade.level > CRITERION_LEVEL_MAX) {
        throw invalid()
    }
    return {
        criterionId: criterion.id,
        criterion: criterion.criterion,
        level: grade.level,
        evidenceQuote: quoteOf(grade, source),
        maxScore: criterion.maxScore,
        missing: missingOf(grade.level, grade.missing ?? "", criterion.expectedEvidence),
    }
}

/**
 * Turns the answer of the coach into the stored result, or refuses it: the grade must hold exactly one level from 0 to 2 for
 * every rubric criterion, and a level above 0 must quote words that the answer of the learner really contains. Points are
 * the share of the criterion maximum that the level reaches.
 */
export const gradeRubric = (activity: LessonActivity, answer: AttemptAnswer, grade: CoachGrade): AttemptResult => {
    const rubric = coachRubricOf(activity)
    if (grade.criteria.length !== rubric.length) throw invalid()
    const source = squashed([answer.text ?? "", ...(answer.files ?? []).map((file) => file.content)].join("\n"))
    const criteria = rubric.map((criterion) =>
        criterionResultOf(
            criterion,
            grade.criteria.find((entry) => entry.criterionId === criterion.id),
            source,
        ),
    )
    return {
        isDiagnostic: activity.isDiagnostic === true,
        correct: null,
        options: [],
        success: null,
        reachedStateId: null,
        criteria,
        score: criteria.reduce((total, entry) => total + (entry.maxScore * entry.level) / CRITERION_LEVEL_MAX, 0),
        maxScore: criteria.reduce((total, entry) => total + entry.maxScore, 0),
    }
}

/**
 * Completes the notes of a result stored before graders gave them: a criterion below the full level with no note takes the
 * expected evidence of the rubric. A result that has every note comes back unchanged.
 */
export const withExpectedNotes = (
    result: StoredAttemptResult,
    expectedEvidence: Readonly<Record<string, string>>,
): StoredAttemptResult => {
    if (
        result.criteria.every((criterion) => criterion.level >= CRITERION_LEVEL_MAX || (criterion.missing ?? "") !== "")
    )
        return result
    return {
        ...result,
        criteria: result.criteria.map((criterion) => {
            const note = criterion.missing ?? ""
            return {
                ...criterion,
                missing:
                    note === "" ? missingOf(criterion.level, "", expectedEvidence[criterion.criterionId] ?? "") : note,
            }
        }),
    }
}
