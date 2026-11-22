import { Badge, Cluster, Heading, ProgressCircle, Stack, SurfaceCard, Text } from "@starci/grammar/common"
import { ArtImage, type topicArt } from "../../leaves/Art"

/** One topic of the catalog as its card draws it, every word resolved by the block. */
type TopicCardData = {
    readonly id: string
    readonly title: string
    /** What the topic is about, one line. */
    readonly description: string
    /** Lessons and time (for example "6 lessons · 2 h"). */
    readonly metaLabel: string
    readonly badge: { readonly label: string; readonly tone: "success" | "warning" | "neutral" }
    /** Lessons done over the lessons of the topic. */
    readonly done: number
    readonly total: number
    readonly href: string
}

/** Props of one topic card. */
type TopicCardProps = {
    readonly topic: TopicCardData
    readonly art: ReturnType<typeof topicArt>
    /** The public base of the statics. */
    readonly artBase: string
    /** The accessible name of the whole-card link (for example "View topic"). */
    readonly openLabel: string
    /** The accessible name of the ring (for example "2 of 6 lessons done"). */
    readonly ringLabel: string
    readonly isLoading?: boolean
}

/**
 * A topic of the catalog: its 3D picture, its name with the ring of lessons done, the one line of what it is about, its state and its
 * size. The whole card opens the topic.
 */
export const TopicCard = (props: TopicCardProps) => (
    <SurfaceCard
        height="fill"
        wholeAction={{ kind: "link", href: props.topic.href, label: `${props.openLabel}: ${props.topic.title}` }}
        {...(props.isLoading === true ? { isLoading: true } : {})}
    >
        <Stack gap="row">
            <ArtImage asset={props.art} base={props.artBase} />
            <Cluster gap="inline" align="center" justify="between" wrap={false}>
                <Heading level={3}>{props.topic.title}</Heading>
                <Cluster gap="inline" align="center" wrap={false}>
                    <Text as="span" role="caption" tabular>
                        {`${props.topic.done}/${props.topic.total}`}
                    </Text>
                    <ProgressCircle
                        label={props.ringLabel}
                        size="sm"
                        value={props.topic.total === 0 ? 0 : Math.round((props.topic.done / props.topic.total) * 100)}
                    />
                </Cluster>
            </Cluster>
            {props.topic.description === "" ? null : (
                <Text as="p" tone="muted" overflow="clamp-2">
                    {props.topic.description}
                </Text>
            )}
            <Cluster gap="inline" align="center">
                <Badge tone={props.topic.badge.tone}>{props.topic.badge.label}</Badge>
                <Text as="span" role="caption">
                    {props.topic.metaLabel}
                </Text>
            </Cluster>
        </Stack>
    </SurfaceCard>
)
