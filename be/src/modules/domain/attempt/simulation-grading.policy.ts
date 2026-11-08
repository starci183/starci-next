import type { LessonActivity } from "@modules/domain/lesson"
import type { AttemptAnswer, AttemptResult } from "./attempt.contracts"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"

/**
 * Grades a simulation by walking the reported actions through the stored state machine from its initial state. A step the
 * machine does not allow, or a path that does not end where the learner says, is refused; a valid path is a success when it
 * ends in a goal state.
 */
export const gradeSimulation = (activity: LessonActivity, answer: AttemptAnswer): AttemptResult => {
    const simulation = activity.simulation
    if (simulation === undefined) throw new AttemptError({ code: AttemptErrorCode.AnswerInvalid })
    const reached = (answer.actionIds ?? []).reduce<string | null>((stateId, actionId) => {
        const edge = simulation.transitions.find(
            (transition) => transition.fromStateId === stateId && transition.actionId === actionId,
        )
        return edge?.toStateId ?? null
    }, simulation.initialStateId)
    if (reached === null || reached !== answer.reachedStateId) {
        throw new AttemptError({ code: AttemptErrorCode.AnswerInvalid })
    }
    const success = simulation.states.find((state) => state.id === reached)?.isSuccess === true
    return {
        isDiagnostic: activity.isDiagnostic === true,
        correct: null,
        options: [],
        success,
        reachedStateId: reached,
        criteria: [],
        score: success ? 1 : 0,
        maxScore: 1,
    }
}
