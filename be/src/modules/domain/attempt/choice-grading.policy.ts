import type { LessonActivity } from "@modules/domain/lesson"
import type { AttemptAnswer, AttemptResult } from "./attempt.contracts"

/** Grades a choice by comparing the pick with the stored correctness and releases every option explanation. */
export const gradeChoice = (activity: LessonActivity, answer: AttemptAnswer): AttemptResult => {
    const options = (activity.options ?? []).map((option) => ({
        optionId: option.id,
        isCorrect: option.isCorrect,
        selected: option.id === answer.optionId,
        explanation: option.explanation,
    }))
    const correct = options.some((option) => option.selected && option.isCorrect)
    return {
        isDiagnostic: activity.isDiagnostic === true,
        correct,
        options,
        success: null,
        reachedStateId: null,
        criteria: [],
        score: correct ? 1 : 0,
        maxScore: 1,
    }
}
