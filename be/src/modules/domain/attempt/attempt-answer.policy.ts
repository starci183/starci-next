import type { LessonActivity, LessonPhase } from "@modules/domain/lesson"
import type { AttemptAnswer, AttemptKind, AttemptServerActivity } from "./attempt.contracts"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"

/** The answer with no field set, which every normalized answer starts from. */
const EMPTY_ANSWER: AttemptAnswer = {
    optionId: null,
    text: null,
    actionIds: null,
    reachedStateId: null,
    debrief: null,
    files: null,
}

const invalid = (): AttemptError => new AttemptError({ code: AttemptErrorCode.AnswerInvalid })

const trimmed = (value: string | null): string | null => {
    const text = value?.trim() ?? ""
    return text === "" ? null : text
}

/**
 * The kind of attempt an activity takes. A review activity and a written activity without a rubric take none, so nothing
 * can be stored for them.
 */
export const attemptKindOf = (activity: LessonActivity): AttemptKind => {
    if (activity.kind === "retrieval") throw new AttemptError({ code: AttemptErrorCode.ActivityUnsupported })
    const isWritten = activity.kind === "explain" || activity.kind === "exercise"
    if (isWritten && (activity.rubric ?? []).length === 0) {
        throw new AttemptError({ code: AttemptErrorCode.ActivityUnsupported })
    }
    return activity.kind
}

/** The phase an attempt is stored under; the phase of a review activity is not one, so it takes no attempt. */
export const attemptPhaseOf = (found: AttemptServerActivity): LessonPhase => {
    if (found.phase === "retrieval") throw new AttemptError({ code: AttemptErrorCode.ActivityUnsupported })
    return found.phase
}

const choiceAnswer = (activity: LessonActivity, answer: AttemptAnswer): AttemptAnswer => {
    const picked = (activity.options ?? []).find((option) => option.id === answer.optionId)
    if (picked === undefined) throw invalid()
    return { ...EMPTY_ANSWER, optionId: picked.id }
}

const simulationAnswer = (answer: AttemptAnswer): AttemptAnswer => {
    if (answer.reachedStateId === null) throw invalid()
    return {
        ...EMPTY_ANSWER,
        actionIds: answer.actionIds ?? [],
        reachedStateId: answer.reachedStateId,
        debrief: trimmed(answer.debrief),
    }
}

const writtenAnswer = (kind: AttemptKind, answer: AttemptAnswer): AttemptAnswer => {
    const text = trimmed(answer.text)
    if (text === null) throw invalid()
    return { ...EMPTY_ANSWER, text, files: kind === "exercise" ? (answer.files ?? []) : null }
}

/**
 * The answer as it is stored: only the fields of the kind are kept, text is trimmed, and an answer that cannot fit the
 * activity (an option it does not list, no state reached, no text) is refused.
 */
export const normalizeAnswer = (activity: LessonActivity, kind: AttemptKind, answer: AttemptAnswer): AttemptAnswer => {
    switch (kind) {
        case "choice":
            return choiceAnswer(activity, answer)
        case "simulation":
            return simulationAnswer(answer)
        case "explain":
        case "exercise":
            return writtenAnswer(kind, answer)
    }
}
