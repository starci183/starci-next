import type { LessonActivity } from "@modules/domain/lesson"
import type {
    AttemptAnswer,
    AttemptResult,
    CoachCriterion,
    CoachCriterionGrade,
    CoachGrade,
    CriterionResult,
} from "./attempt.contracts"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"

/** The highest level a criterion reaches; levels are whole numbers from 0 to this. */
export const CRITERION_LEVEL_MAX = 2

/** The longest evidence quote a grade may carry. */
const QUOTE_MAX = 600

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
