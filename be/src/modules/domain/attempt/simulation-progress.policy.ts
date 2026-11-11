import type { LessonActivity } from "@modules/domain/lesson"
import type { SaveSimulationProgressParams } from "./attempt.contracts"
import { AttemptError, AttemptErrorCode } from "./errors/attempt.error"

/** The longest path a learner may save; a state machine walk longer than this is not a lesson path. */
export const SIMULATION_PATH_MAX = 60

/** What a valid simulation position holds. */
export interface SimulationPosition {
    /** The state the path ends in. */
    readonly currentStateId: string
    /** The actions of the path. */
    readonly actionIds: ReadonlyArray<string>
    /** The transitions the path takes, in order. */
    readonly transitionIds: ReadonlyArray<string>
}

/**
 * Walks the saved actions through the stored state machine from its initial state and answers the position they reach. A path
 * the machine does not allow, one that ends elsewhere than the learner says, or one that is too long, is refused, so the stored
 * progress can always be replayed on reload.
 */
export const simulationPositionOf = (
    activity: LessonActivity,
    params: Pick<SaveSimulationProgressParams, "currentStateId" | "actionIds">,
): SimulationPosition => {
    const simulation = activity.simulation
    if (activity.kind !== "simulation" || simulation === undefined || params.actionIds.length > SIMULATION_PATH_MAX)
        throw new AttemptError({ code: AttemptErrorCode.AnswerInvalid })
    let stateId = simulation.initialStateId
    const transitionIds: Array<string> = []
    for (const actionId of params.actionIds) {
        const edge = simulation.transitions.find(
            (transition) => transition.fromStateId === stateId && transition.actionId === actionId,
        )
        if (edge === undefined) throw new AttemptError({ code: AttemptErrorCode.AnswerInvalid })
        transitionIds.push(edge.id)
        stateId = edge.toStateId
    }
    if (stateId !== params.currentStateId) throw new AttemptError({ code: AttemptErrorCode.AnswerInvalid })
    return { currentStateId: stateId, actionIds: [...params.actionIds], transitionIds }
}
