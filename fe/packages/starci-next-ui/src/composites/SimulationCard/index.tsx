import { Alert, Badge, Button, Cluster, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** The words of a simulation card, resolved by its block. */
export type SimulationCardLabels = {
    readonly states: string
    readonly current: string
    readonly seen: string
    readonly ahead: string
    readonly observing: string
    readonly succeeded: string
    readonly noMoves: string
    readonly restart: string
}

/** Where a state stands in the row of states: the one the learner is in, one they walked through, or one still ahead. */
type StepMark = "current" | "seen" | "ahead"

/** One simulation: the row of states, the observation of the current one and the actions that lead on. */
type SimulationCardProps = {
    readonly prompt: string
    readonly steps: ReadonlyArray<{ readonly id: string; readonly label: string; readonly mark: StepMark }>
    readonly currentLabel: string
    readonly observation: string
    /** True when the current state is a goal. */
    readonly isSuccess: boolean
    readonly moves: ReadonlyArray<{ readonly id: string; readonly label: string; readonly toStateId: string }>
    readonly labels: SimulationCardLabels
    readonly onMove: (actionId: string, toStateId: string) => void
    readonly onRestart: () => void
}

/** The tone of a state in the row: the current one stands out, the ones walked are settled, the ones ahead are quiet. */
const toneOf = (mark: StepMark): "accent" | "success" | "muted" => {
    if (mark === "current") return "accent"
    return mark === "seen" ? "success" : "muted"
}

/**
 * A client-side state machine from the public projection of a simulation: the learner takes an action, reads the observation of
 * the state it leads to and goes on until a goal state. It holds no answer and calls no door.
 */
export const SimulationCard = (props: SimulationCardProps) => (
    <SurfaceCard ariaLabel={props.prompt}>
        <Stack gap="row">
            <Text as="p">{props.prompt}</Text>
            <Cluster gap="inline" label={props.labels.states}>
                {props.steps.map((step) => (
                    <Badge key={step.id} tone={toneOf(step.mark)}>
                        {`${props.labels[step.mark]} · ${step.label}`}
                    </Badge>
                ))}
            </Cluster>
            <Alert
                tone={props.isSuccess ? "affirmative" : "informative"}
                title={`${props.isSuccess ? props.labels.succeeded : props.labels.observing} · ${props.currentLabel}`}
                description={props.observation}
            />
            <Cluster gap="row" wrap>
                {props.moves.map((move) => (
                    <Button key={move.id} intent="alternative" onPress={() => props.onMove(move.id, move.toStateId)}>
                        {move.label}
                    </Button>
                ))}
                {props.moves.length === 0 ? <Text tone="muted">{props.labels.noMoves}</Text> : null}
                <Button intent="neutral" onPress={props.onRestart}>
                    {props.labels.restart}
                </Button>
            </Cluster>
        </Stack>
    </SurfaceCard>
)
