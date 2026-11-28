import { Cluster, IconTile, Section, Stack, Text, type MarkState } from "@starci/grammar/common"
import { TickGlyph } from "../../leaves/Icon"
import type { LabBootLabels, LabBootView } from "./types"

/** What one stage row needs: its place in the order, its state, its words and how long it took. */
type StageRowProps = {
    readonly index: number
    readonly state: MarkState
    readonly label: string
    /** "38s" once it ended; empty before. */
    readonly duration: string
}

/** The tone of a stage's square tile: the one running in the accent, a failed one in danger, the rest neutral. */
const toneOf = (state: MarkState): "accent" | "danger" | "neutral" => {
    if (state === "running") return "accent"
    return state === "error" ? "danger" : "neutral"
}

/**
 * The square tile of a stage (owner 2026-11-28: "sao chưa chọn hình vuông mà chọn hình tròn? icon tile có thể số mà"): Grammar's step tile
 * with the stage's number, accent while it runs, danger once it failed, neutral while it waits; a finished stage is the same square with a
 * tick on the success plate. Never the round status mark: the five stages read as numbered steps.
 */
export const StageTile = (props: { readonly index: number; readonly state: MarkState }) =>
    props.state === "done" ? (
        <IconTile source={TickGlyph} tone="success" />
    ) : (
        <IconTile step={props.index + 1} tone={toneOf(props.state)} />
    )

/** One stage of the boot: its square tile, its words beside it and, once it ended, its time muted under them. */
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
 * square tile with its state and how long it took, the line the machine reported under a stage that failed, and the note that the first time waits
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
