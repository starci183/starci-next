import { useState } from "react"
import { Stack } from "@starci/grammar/common"
import { EventLog, Moves, Observation, StatesRow } from "./parts"
import type { SimulationCardProps, Walk } from "./types"
import { pressed, progressOf, startWalk, stateIdAfter } from "./walk"

export type {
    SimulationAction,
    SimulationCardLabels,
    SimulationProgress,
    SimulationState,
    SimulationStep,
    SimulationTransition,
} from "./types"

/**
 * A client-side state machine in cards: the row of states (the current one with the accent ring), its observation and counters,
 * every action as a button (an action the current state has no edge for is disabled and says so) with the progress line, "back
 * one step" and "start over" (no state is a dead end), and the event log. It keeps the walk itself, starts from `initialSteps`
 * and reports every change through `onChange`; it calls no door.
 */
export const SimulationCard = (props: SimulationCardProps) => {
    const [walk, setWalk] = useState<Walk>(() => startWalk(props))
    const current = props.states.find((state) => state.id === stateIdAfter(props.initialStateId, walk.steps))
    const commit = (next: Walk): void => {
        setWalk(next)
        props.onChange?.(progressOf(props, next))
    }
    return (
        <Stack gap="section">
            <StatesRow card={props} walk={walk} />
            {current === undefined ? null : <Observation state={current} labels={props.labels} />}
            <Moves
                card={props}
                walk={walk}
                onPress={(actionId) => commit(pressed(props, walk, actionId))}
                onBack={() => commit({ steps: walk.steps.slice(0, -1), tried: walk.tried })}
                onRestart={() => commit({ steps: [], tried: walk.tried })}
            />
            <EventLog card={props} walk={walk} />
        </Stack>
    )
}
