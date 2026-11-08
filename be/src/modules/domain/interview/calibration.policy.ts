import type { ExampleResult } from "./interview.contracts"

/** How far the grader may land from the authored score of a sample answer. */
export const CALIBRATION_TOLERANCE = 15

/** How much a weaker sample answer may outscore a stronger one before the order counts as broken. */
export const CALIBRATION_ORDER_SLACK = 5

/** The share of a bank's questions that must agree before the bank may be published. */
export const CALIBRATION_MIN_AGREEMENT = 0.8

/** The most the two reference models may differ before their sample score is too uncertain to hold the grader to. */
export const CALIBRATION_REFERENCE_SPREAD = 30

/** What the grader scored for one sample answer. */
export interface SampleGrade {
    /** The level of the sample answer, 1 strongest. */
    readonly level: number
    /** The authored score the grader is held to, or null when the reference models gave none worth holding it to. */
    readonly authored: number | null
    /** The score the grader gave. */
    readonly graded: number
}

/** The verdict on one question. */
export interface QuestionCalibration {
    /** The question id. */
    readonly questionId: string
    /** Whether the grader agreed with the teacher's samples. */
    readonly ok: boolean
    /** Why not, or an empty text. */
    readonly reason: string
}

/** The verdict on one bank. */
export interface BankCalibration {
    /** Whether the bank may be published. */
    readonly passed: boolean
    /** The share of questions that agreed, 0 to 1. */
    readonly agreement: number
    /** One verdict per question. */
    readonly questions: ReadonlyArray<QuestionCalibration>
}

/**
 * The score the teacher's samples hold the grader to: the mean of the reference scores that exist. Null when neither exists or when
 * the two disagree so widely that neither is a ground truth.
 */
export const authoredScoreOf = (example: ExampleResult): number | null => {
    const { sonnet: first, haiku: second } = example
    if (first === null) return second
    if (second === null) return first
    return Math.abs(first - second) > CALIBRATION_REFERENCE_SPREAD ? null : (first + second) / 2
}

/** Judges one question: the graded scores keep the order of the levels and land within the tolerance of the authored ones. */
export const questionCalibrationOf = (questionId: string, grades: ReadonlyArray<SampleGrade>): QuestionCalibration => {
    const ordered = [...grades].sort((a, b) => a.level - b.level)
    const broken = ordered.find((grade, index) => {
        const stronger = ordered[index - 1]
        return stronger !== undefined && grade.graded > stronger.graded + CALIBRATION_ORDER_SLACK
    })
    if (broken !== undefined) {
        return { questionId, ok: false, reason: `level ${broken.level} scored above a stronger answer` }
    }
    const far = ordered.flatMap((grade) =>
        grade.authored !== null && Math.abs(grade.graded - grade.authored) > CALIBRATION_TOLERANCE
            ? [{ level: grade.level, graded: grade.graded, authored: grade.authored }]
            : [],
    )[0]
    if (far !== undefined) {
        return {
            questionId,
            ok: false,
            reason: `level ${far.level} landed ${Math.round(far.graded)} against ${Math.round(far.authored)}`,
        }
    }
    return { questionId, ok: true, reason: "" }
}

/** Judges a bank from its questions: it passes when enough of them agree. */
export const bankCalibrationOf = (questions: ReadonlyArray<QuestionCalibration>): BankCalibration => {
    const agreement = questions.length === 0 ? 0 : questions.filter((entry) => entry.ok).length / questions.length
    return { passed: agreement >= CALIBRATION_MIN_AGREEMENT, agreement, questions }
}
