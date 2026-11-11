import { Button, Cluster, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import type { SimulationCardProps, SimulationState, Walk } from "./types"
import { branchesOf, clockOf, isOpenIn, stateIdAfter, statusOf } from "./walk"

/** The props of the states row. */
type StatesRowProps = { readonly card: SimulationCardProps; readonly walk: Walk }

/** The props of the event log. */
type EventLogProps = { readonly card: SimulationCardProps; readonly walk: Walk }

/** The lead-in sentence and the row of states: each a card, the current one with the accent ring. */
export const StatesRow = (props: StatesRowProps) => {
    const currentId = stateIdAfter(props.card.initialStateId, props.walk.steps)
    return (
        <Stack gap="row">
            <Text>{props.card.prompt}</Text>
            <Cluster gap="inline" wrap>
                {props.card.states.map((state) => (
                    <SurfaceCard
                        key={state.id}
                        ariaLabel={state.label}
                        {...(state.id === currentId ? { emphasis: "accent" as const } : {})}
                    >
                        <Stack gap="identity">
                            <Text isStrong>{state.label}</Text>
                            {state.id === currentId ? (
                                <Text size="xs" tone="muted">
                                    {props.card.labels.current}
                                </Text>
                            ) : null}
                        </Stack>
                    </SurfaceCard>
                ))}
            </Cluster>
        </Stack>
    )
}

/** What the observation needs. */
type ObservationProps = { readonly state: SimulationState; readonly labels: SimulationCardProps["labels"] }

/** The observation of the current state and, when it has counters, those as figures. */
export const Observation = (props: ObservationProps) => (
    <Stack gap="row">
        <SurfaceCard label={props.state.isSuccess ? props.labels.succeeded : props.labels.observing}>
            <Text>{props.state.observation}</Text>
        </SurfaceCard>
        {props.state.facts === undefined || props.state.facts.length === 0 ? null : (
            <SurfaceCard
                kind="figures"
                label={props.state.label}
                items={props.state.facts.map((fact) => ({ id: fact.label, term: fact.label, value: fact.value }))}
            />
        )}
    </Stack>
)

/** What the moves card needs: the props, the walk and the three commands. */
type MovesProps = {
    readonly card: SimulationCardProps
    readonly walk: Walk
    readonly onPress: (actionId: string) => void
    readonly onBack: () => void
    readonly onRestart: () => void
}

/** Every action as a row with its button; the progress line, back and start over in the footer. */
export const Moves = (props: MovesProps) => {
    const { card, walk } = props
    const branches = branchesOf(card)
    const triedCount = branches.filter((action) => walk.tried.includes(action.id)).length
    return (
        <SurfaceCard
            kind="list"
            label={card.labels.moves}
            empty={card.labels.noMoves}
            items={card.actions.map((action) => ({
                id: action.id,
                title: action.label,
                description: statusOf(card, walk, action.id),
                control: (
                    <Button
                        intent="neutral"
                        size="sm"
                        isDisabled={!isOpenIn(card, walk, action.id)}
                        onPress={() => props.onPress(action.id)}
                    >
                        {action.label}
                    </Button>
                ),
            }))}
            footers={[
                {
                    kind: "custom",
                    children: (
                        <Cluster gap="row" wrap justify="between" align="center">
                            <Text size="xs" tone="muted">
                                {card.labels.progress
                                    .replace("{tried}", String(triedCount))
                                    .replace("{total}", String(branches.length))}
                            </Text>
                            <Cluster gap="inline" wrap>
                                <Button intent="neutral" size="sm" isDisabled={walk.steps.length === 0} onPress={props.onBack}>
                                    {card.labels.back}
                                </Button>
                                <Button intent="neutral" size="sm" isDisabled={walk.steps.length === 0} onPress={props.onRestart}>
                                    {card.labels.restart}
                                </Button>
                            </Cluster>
                        </Cluster>
                    ),
                },
            ]}
        />
    )
}

/** The event log: one row per press, the newest last. */
export const EventLog = (props: EventLogProps) => {
    const { card, walk } = props
    const labelOfState = (id: string): string => card.states.find((state) => state.id === id)?.label ?? id
    const labelOfAction = (id: string): string => card.actions.find((action) => action.id === id)?.label ?? id
    return (
        <SurfaceCard
            kind="list"
            label={card.labels.log}
            empty={card.labels.logEmpty}
            items={walk.steps.map((step, index) => ({
                id: `${index}-${step.at}`,
                title: labelOfAction(step.actionId),
                description: `${clockOf(step.at)} · ${labelOfState(stateIdAfter(card.initialStateId, walk.steps.slice(0, index)))} → ${labelOfState(step.toStateId)}`,
            }))}
        />
    )
}
