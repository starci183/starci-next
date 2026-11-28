import { Cluster, IconTile, Section, Stack, Text, type MarkState } from "@starci/grammar/common"
import { ITEM_TILE } from "../../leaves/Icon"
import type { LabBootLabels, LabBootView } from "./types"

/** What one stage row needs: its place in the order, its state, its words and how long it took. */
type StageRowProps = {
    readonly index: number
    readonly state: MarkState
    readonly label: string
    /** "38s" once it ended; empty before. */
    readonly duration: string
}

/**
 * The round tile of a stage (owner 2026-11-28: "số 1-5 phải hình tròn chứ"): Grammar's status mark, the plate the stage's state (waiting
 * neutral, running with its spinning ring, failed danger) and the stage's number its subject; a finished stage is the mark's own tick. The
 * setup's three steps are square step tiles; the relay's stages are round, because they are a run's progress, not steps the learner takes.
 */
export const StageTile = (props: { readonly index: number; readonly state: MarkState }) =>
    // A stage of the run is a line to read: the round 20 (owner 2026-11-28, the tile sizes), its state alone (empty, turning, tick, x).
    <IconTile state={props.state} ariaLabel={`${String(props.index + 1)}`} {...ITEM_TILE} />

/** One stage of the boot: its round numbered tile, its words beside it and, once it ended, its time muted under them. */
export const StageRow = (props: StageRowProps) => (
    <Cluster gap="row" align="center" wrap={false}>
        <StageTile index={props.index} state={props.state} />
        <Stack gap="identity">
            <Text role="body">{props.label}</Text>
            {props.duration === "" ? null : (
                <Text role="caption" tone="muted">
                    {props.duration}
                </Text>
            )}
        </Stack>
    </Cluster>
)

/** What the boot needs: the stages and the words. */
type LabBootProps = {
    readonly boot: LabBootView
    readonly labels: LabBootLabels
    readonly isLoading: boolean
}

/**
 * The lab while the machine brings it up: the stages in order (machine checks, source, compose up, seed, first test run), each a numbered
 * round tile with its state and how long it took, the line the machine reported under a stage that failed, and the note that the first time waits
 * for the Docker images.
 */
export const LabBoot = (props: LabBootProps) => {
    const { boot, labels } = props
    return (
        <Section title={labels.title(boot.machine)} headingLevel={2} isLoading={props.isLoading}>
            <Stack gap="row">
                {boot.stages.map((stage, index) => (
                    <Stack key={stage.id} gap="identity">
                        <StageRow index={index} state={stage.state} label={stage.label} duration={stage.duration} />
                        {stage.state === "error" && stage.detail !== "" ? (
                            <Text role="body" tone="muted">
                                {stage.detail}
                            </Text>
                        ) : null}
                    </Stack>
                ))}
                <Text role="caption" tone="muted">
                    {labels.firstTime}
                </Text>
            </Stack>
        </Section>
    )
}
