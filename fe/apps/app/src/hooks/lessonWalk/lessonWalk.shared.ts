import type { SimulationStep } from "@starci-next/ui"
import type { SimulationProgressView, SimulationView } from "@/modules/types"

/** The steps of a saved walk: the actions pressed from the initial state, each leading where the machine's edges say. */
export const stepsOfWalk = (simulation: SimulationView, saved: SimulationProgressView | undefined): ReadonlyArray<SimulationStep> => {
    const steps: Array<SimulationStep> = []
    let stateId = simulation.initialStateId
    for (const actionId of saved?.actionIds ?? []) {
        const edge = simulation.edges.find((each) => each.fromStateId === stateId && each.actionId === actionId)
        if (edge === undefined) break
        steps.push({ actionId, toStateId: edge.toStateId, at: saved?.updatedAt ?? "" })
        stateId = edge.toStateId
    }
    return steps
}

/** The actions whose transitions the server saw pressed. */
export const triedActionsOf = (simulation: SimulationView, saved: SimulationProgressView | undefined): ReadonlyArray<string> => [
    ...new Set(
        simulation.edges.flatMap((edge) => ((saved?.triedTransitionIds ?? []).includes(edge.id) ? [edge.actionId] : [])),
    ),
]

/** The actions as the card counts them: the lesson marks which ones are branches; when it marks none, every action counts as one. */
export const branchActionsOf = (actions: SimulationView["actions"]): SimulationView["actions"] =>
    actions.some((action) => action.isBranch) ? actions : actions.map((action) => ({ ...action, isBranch: true }))
