import { Alert, Badge, Button, Cluster, Section, Stack, Text } from "@starci/grammar/common"
import type { SimulationCardProps, SimulationState, Walk } from "./types"
import { branchesOf, clockOf, isOpenIn, stateIdAfter, statusOf } from "./walk"

/** The props of the states row. */
type StatesRowProps = { readonly card: SimulationCardProps; readonly walk: Walk }

/** The props of the event log. */
type EventLogProps = { readonly card: SimulationCardProps; readonly walk: Walk }

/**
 * The lead-in sentence and the current state: a result the learner's last press settled, so a toned `Badge` after its word ("Hiện tại"),
 * never a control (`chip.choose.role:result`); the other states are named by the moves and the log.
 */
export const StatesRow = (props: StatesRowProps) => {
    const currentId = stateIdAfter(props.card.initialStateId, props.walk.steps)
    const current = props.card.states.find((state) => state.id === currentId)?.label ?? currentId
    return (
        <Stack gap="row">
            <Text>{props.card.prompt}</Text>
            <Cluster gap="inline" align="center" label={props.card.labels.current}>
                <Text role="caption">{props.card.labels.current}</Text>
                <Badge tone="accent">{current}</Badge>
            </Cluster>
        </Stack>
    )
}

/** What the observation needs. */
type ObservationProps = { readonly state: SimulationState; readonly labels: SimulationCardProps["labels"] }

/** The observation of the current state as an alert and, when it has counters, those as figures. */
export const Observation = (props: ObservationProps) => (
    <Stack gap="row">
        <Alert
            tone={props.state.isSuccess ? "affirmative" : "informative"}
            title={props.state.isSuccess ? props.labels.succeeded : props.labels.observing}
            description={props.state.observation}
        />
        {props.state.facts === undefined || props.state.facts.length === 0 ? null : (
            <Section
                kind="figures"
                title={props.state.label}
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

/** Every action as a row with its button; the progress line is the fact of the head, back and start over its actions. */
export const Moves = (props: MovesProps) => {
    const { card, walk } = props
    const branches = branchesOf(card)
    const triedCount = branches.filter((action) => walk.tried.includes(action.id)).length
    return (
        <Section
            kind="list"
            title={card.labels.moves}
            fact={card.labels.progress
                .replace("{tried}", String(triedCount))
                .replace("{total}", String(branches.length))}
            action={
                <Cluster gap="inline" wrap>
                    <Button variant="border" size="sm" isDisabled={walk.steps.length === 0} onPress={props.onBack}>
                        {card.labels.back}
                    </Button>
                    <Button variant="border" size="sm" isDisabled={walk.steps.length === 0} onPress={props.onRestart}>
                        {card.labels.restart}
                    </Button>
                </Cluster>
            }
            empty={card.labels.noMoves}
            items={card.actions.map((action) => ({
                id: action.id,
                title: action.label,
                description: statusOf(card, walk, action.id),
                control: (
                    <Button
                        variant="border"
                        size="sm"
                        isDisabled={!isOpenIn(card, walk, action.id)}
                        onPress={() => props.onPress(action.id)}
                    >
                        {action.label}
                    </Button>
                ),
            }))}
        />
    )
}

/** The event log: one row per press, the newest last. */
export const EventLog = (props: EventLogProps) => {
    const { card, walk } = props
    const labelOfState = (id: string): string => card.states.find((state) => state.id === id)?.label ?? id
    const labelOfAction = (id: string): string => card.actions.find((action) => action.id === id)?.label ?? id
    return (
        <Section
            kind="list"
            title={card.labels.log}
            empty={card.labels.logEmpty}
            items={walk.steps.map((step, index) => ({
                id: `${index}-${step.at}`,
                title: labelOfAction(step.actionId),
                description: `${clockOf(step.at)} · ${labelOfState(stateIdAfter(card.initialStateId, walk.steps.slice(0, index)))} → ${labelOfState(step.toStateId)}`,
            }))}
        />
    )
}
