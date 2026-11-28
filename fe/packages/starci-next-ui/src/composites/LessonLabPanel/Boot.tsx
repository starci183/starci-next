import { Cluster, IconTile, Section, Stack, Text, type IconSource, type MarkState } from "@starci/grammar/common"
import { ContainerGlyph, DataGlyph, DownloadGlyph, MachineGlyph, PlayGlyph } from "../../leaves/Icon"
import type { LabBootLabels, LabBootView } from "./types"

/**
 * The subject of each boot stage in the order the relay runs them (machine checks, the code, Docker, the sample data, the first run): the
 * glyph its status tile carries, so the five rows read as five different jobs and the tile's plate says how each one stands.
 */
const STAGE_GLYPHS: ReadonlyArray<IconSource> = [MachineGlyph, DownloadGlyph, ContainerGlyph, DataGlyph, PlayGlyph]

/** What one stage row needs: its place in the order, its state, its words and how long it took. */
type StageRowProps = {
    readonly index: number
    readonly state: MarkState
    readonly label: string
    /** "38s" once it ended; empty before. */
    readonly duration: string
}

/**
 * One stage of the boot (owner 2026-11-28: "tương tự dùng icon tile"): Grammar's status mark with the stage's own glyph (case 2 of the
 * status-mark rule: the plate is the state, the glyph the subject), the stage's words beside it and, once it ended, its time muted under them.
 */
export const StageRow = (props: StageRowProps) => (
    <Cluster gap="row" align="center" wrap={false}>
        <IconTile state={props.state} source={STAGE_GLYPHS[props.index] ?? PlayGlyph} />
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
 * The lab while the machine brings it up: the stages in order (machine checks, source, compose up, seed, first test run), each an icon
 * tile with its state and how long it took, the line the machine reported under a stage that failed, and the note that the first time waits
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
