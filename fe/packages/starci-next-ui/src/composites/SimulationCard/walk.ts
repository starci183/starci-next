import type { SimulationCardProps, SimulationProgress, SimulationStep, Walk } from "./types"

/** Two digits. */
const two = (n: number): string => String(n).padStart(2, "0")

/** HH:mm:ss of an ISO time, in the zone of the reader. */
export const clockOf = (iso: string): string => {
    const date = new Date(iso)
    return `${two(date.getHours())}:${two(date.getMinutes())}:${two(date.getSeconds())}`
}

/** The state the steps end in. */
export const stateIdAfter = (initialStateId: string, steps: ReadonlyArray<SimulationStep>): string =>
    steps.at(-1)?.toStateId ?? initialStateId

/** The actions that count as branches. */
export const branchesOf = (props: Pick<SimulationCardProps, "actions">): SimulationCardProps["actions"] =>
    props.actions.filter((action) => action.isBranch !== false)

/** The walk a card starts from: the saved one, or none. */
export const startWalk = (props: Pick<SimulationCardProps, "initialSteps" | "initialTriedActionIds">): Walk => {
    const steps = props.initialSteps ?? []
    return { steps, tried: props.initialTriedActionIds ?? steps.map((step) => step.actionId) }
}

/** What `onChange` reports for a walk. */
export const progressOf = (props: SimulationCardProps, walk: Walk): SimulationProgress => {
    const currentStateId = stateIdAfter(props.initialStateId, walk.steps)
    const branches = branchesOf(props)
    return {
        steps: walk.steps,
        currentStateId,
        isSuccess: props.states.find((state) => state.id === currentStateId)?.isSuccess ?? false,
        triedActionIds: walk.tried,
        triedCount: branches.filter((action) => walk.tried.includes(action.id)).length,
        totalCount: branches.length,
    }
}

/** True when the current state has an edge for the action. */
export const isOpenIn = (props: SimulationCardProps, walk: Walk, actionId: string): boolean => {
    const from = stateIdAfter(props.initialStateId, walk.steps)
    return props.transitions.some((each) => each.fromStateId === from && each.actionId === actionId)
}

/** The walk after pressing an action in the current state; the same walk when the state has no edge for it. */
export const pressed = (props: SimulationCardProps, walk: Walk, actionId: string): Walk => {
    const from = stateIdAfter(props.initialStateId, walk.steps)
    const edge = props.transitions.find((each) => each.fromStateId === from && each.actionId === actionId)
    if (edge === undefined) return walk
    return {
        steps: [...walk.steps, { actionId, toStateId: edge.toStateId, at: new Date().toISOString() }],
        tried: walk.tried.includes(actionId) ? walk.tried : [...walk.tried, actionId],
    }
}

/** The status line of an action in the current state. */
export const statusOf = (props: SimulationCardProps, walk: Walk, actionId: string): string => {
    if (!isOpenIn(props, walk, actionId)) return props.labels.unavailable
    return walk.tried.includes(actionId) ? props.labels.tried : props.labels.untried
}
