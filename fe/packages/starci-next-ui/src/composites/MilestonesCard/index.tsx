import { Badge, Grid, Meter, ProgressCircle, Section, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { ArtImage, areaArt } from "../../leaves/Art"
import type { MilestoneRowView } from "../ProjectAside/types"

/** What the milestones card needs: its rows, its label, the line of its empty state and the base of the statics for its picture. */
type MilestonesCardProps = {
    readonly rows: ReadonlyArray<MilestoneRowView>
    readonly label: string
    readonly emptyLabel: string
    readonly isLoading: boolean
    readonly staticsBaseUrl: string
}

/** One milestone as a card on the track: the ring of its proved share, its state chip, the proved count and a bar; the whole card a link. */
const MilestoneStep = (props: {
    readonly row: MilestoneRowView
    readonly label: string
    readonly position: number
}) => (
    <SurfaceCard
        label={`${props.position}. ${props.row.title}`}
        headingLevel={3}
        labelEnd={<ProgressCircle label={`${props.label}: ${props.row.title}`} value={props.row.percent} size="sm" />}
        wholeAction={{ kind: "link", href: props.row.href, label: props.row.title }}
    >
        <Stack gap="inline">
            <Badge isDot tone={props.row.chip.tone}>
                {props.row.chip.label}
            </Badge>
            <Text tone="muted">{props.row.meta}</Text>
            <Meter label={props.label} isLabelHidden value={props.row.percent} maxValue={100} tone="informative" />
        </Stack>
    </SurfaceCard>
)

/** The milestones: the 3D picture of the summit beside one card per milestone, in order, each a real link. */
export const MilestonesCard = (props: MilestonesCardProps) => (
    <Section title={props.label} headingLevel={2} count={props.rows.length} isLoading={props.isLoading}>
        {props.rows.length === 0 ? (
            <Text tone="muted">{props.emptyLabel}</Text>
        ) : (
            <Grid
                kind="pair"
                leading={<ArtImage asset={areaArt("milestone")} base={props.staticsBaseUrl} />}
                trailing={
                    <Stack gap="inline">
                        {props.rows.map((row, index) => (
                            <MilestoneStep key={row.id} row={row} label={props.label} position={index + 1} />
                        ))}
                    </Stack>
                }
            />
        )}
    </Section>
)
