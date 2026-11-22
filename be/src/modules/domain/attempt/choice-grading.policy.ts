import { PICKED_FEEDBACK_RELEASE, type LessonActivity } from "@modules/domain/lesson"
import type { AttemptAnswer, AttemptResult } from "./attempt.contracts"

/**
 * Grades a choice by comparing the pick with the stored correctness. It releases every option explanation, except for a choice
 * graded one pick at a time (the opener, `feedbackRelease: picked`): a wrong pick answers the picked option only, so it never names
 * the right one; a right pick solves the question, so it releases every option's reason and carries the insight of the right option.
 */
export const gradeChoice = (activity: LessonActivity, answer: AttemptAnswer): AttemptResult => {
    const isPicked = activity.feedbackRelease === PICKED_FEEDBACK_RELEASE
    const options = (activity.options ?? []).map((option) => ({
        optionId: option.id,
        isCorrect: option.isCorrect,
        selected: option.id === answer.optionId,
        explanation: option.explanation,
    }))
    const correct = options.some((option) => option.selected && option.isCorrect)
    const picked = (activity.options ?? []).find((option) => option.id === answer.optionId)
    return {
        isDiagnostic: activity.isDiagnostic === true,
        correct,
        options: isPicked && !correct ? options.filter((option) => option.selected) : options,
        ...(isPicked ? { insight: correct && picked?.insight !== undefined ? { ...picked.insight } : null } : {}),
        success: null,
        reachedStateId: null,
        criteria: [],
        score: correct ? 1 : 0,
        maxScore: 1,
    }
}
