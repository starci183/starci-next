import { LESSON_PHASES, type LessonPhase, type SimulationView } from "@/modules/types"

/** The phase a route's `phase` query names; anything else opens the overview. */
export const phaseOf = (raw: string | undefined): LessonPhase =>
    LESSON_PHASES.find((phase) => phase === raw) ?? "overview"

/** The state of a simulation by id, or its first state when the id is unknown. */
export const stateOf = (simulation: SimulationView, stateId: string): SimulationView["states"][number] | undefined =>
    simulation.states.find((state) => state.id === stateId) ?? simulation.states[0]

/** An action the learner can take in a state, with the state it leads to. */
type SimulationMove = { readonly actionId: string; readonly label: string; readonly toStateId: string }

/** The actions available in a state: the edges that leave it, worded by their action. */
export const movesFrom = (simulation: SimulationView, stateId: string): ReadonlyArray<SimulationMove> =>
    simulation.edges
        .filter((edge) => edge.fromStateId === stateId)
        .flatMap((edge) => {
            const action = simulation.actions.find((each) => each.id === edge.actionId)
            return action === undefined ? [] : [{ actionId: action.id, label: action.label, toStateId: edge.toStateId }]
        })
