import { Badge, Cluster, Heading, Progress, Stack, SurfaceCard, Text } from "@starci/grammar/common"

/** One row of the path preview on a topic card. */
type TopicPreviewRow = {
    readonly id: string
    readonly title: string
    /** True for a lesson that is published; a source lesson still being moved is quiet. */
    readonly isOpen: boolean
}

/** A topic of the catalog, worded by its block. */
type TopicTileProps = {
    /** The small kind line over the title ("topic"), already in words. */
    readonly eyebrow: string
    readonly title: string
    /** The old course module the topic comes from, already in words; empty hides it. */
    readonly source: string
    /** How many of the topic's lessons are open, already in words. */
    readonly openLabel: string
    readonly preview: ReadonlyArray<TopicPreviewRow>
    /** The progress line at the foot: the learner's progress, or what the plan opens, already in words. */
    readonly status: string
    /** The learner's progress in the topic, 0 to 100. */
    readonly progress: number
    /** The words of the whole-card link. */
    readonly openAction: string
    readonly href: string
}

/** A topic as one card of its group: its kind, name and source, how many lessons are open, a preview of its path and the learner's progress. */
export const TopicTile = (props: TopicTileProps) => (
    <SurfaceCard ariaLabel={props.title} wholeAction={{ kind: "link", href: props.href, label: props.openAction }}>
        <Stack gap="row">
            <Cluster gap="inline" wrap align="center" justify="between">
                <Text size="sm" tone="muted">
                    {props.eyebrow}
                </Text>
                <Badge tone="accent">{props.openLabel}</Badge>
            </Cluster>
            <Heading level={3} scale="standard">
                {props.title}
            </Heading>
            {props.source === "" ? null : (
                <Text size="sm" tone="muted">
                    {props.source}
                </Text>
            )}
            {props.preview.map((row) => (
                <Text key={row.id} size="sm" tone={row.isOpen ? "default" : "muted"} isStrong={row.isOpen}>
                    {row.title}
                </Text>
            ))}
            <Progress label={props.status} value={props.progress} />
        </Stack>
    </SurfaceCard>
)
